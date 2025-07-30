import os
import uuid
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import magic

from app.services.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.agents.parser_agent import ParserAgent
from app.agents.embedding_agent import EmbeddingAgent
from app.services.vector_store import VectorStoreService

router = APIRouter()

# Pydantic models
class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: Optional[int]
    title: Optional[str]
    processing_status: str
    created_at: str
    
    class Config:
        from_attributes = True

class DocumentUploadResponse(BaseModel):
    document: DocumentResponse
    message: str

class URLUploadRequest(BaseModel):
    url: HttpUrl
    title: Optional[str] = None

# Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024  # Convert MB to bytes
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process a document file."""
    try:
        # Validate file size
        if file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Validate file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Detect file type
        file_type = magic.from_file(file_path, mime=True)
        if file_type.startswith('application/'):
            if 'pdf' in file_type:
                detected_type = 'pdf'
            elif 'word' in file_type or 'officedocument' in file_type:
                detected_type = 'docx'
            else:
                detected_type = file_ext[1:]  # Remove the dot
        elif file_type.startswith('text/'):
            detected_type = 'txt'
        else:
            detected_type = file_ext[1:]  # Remove the dot
        
        # Create document record
        document = Document(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=file_path,
            file_type=detected_type,
            file_size=file.size,
            title=title or os.path.splitext(file.filename)[0],
            owner_id=current_user.id,
            processing_status="pending"
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Process document asynchronously (in a real app, you'd use a task queue like Celery)
        await process_document_async(document.id, db)
        
        return DocumentUploadResponse(
            document=DocumentResponse.from_orm(document),
            message="Document uploaded successfully and processing started"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )

@router.post("/upload-url", response_model=DocumentUploadResponse)
async def upload_url(
    url_data: URLUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process a document from URL."""
    try:
        # Create document record for URL
        document = Document(
            filename=f"url_{uuid.uuid4()}.html",
            original_filename=str(url_data.url),
            file_path=str(url_data.url),
            file_type="url",
            file_size=None,
            title=url_data.title or str(url_data.url),
            owner_id=current_user.id,
            processing_status="pending"
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        # Process URL asynchronously
        await process_document_async(document.id, db)
        
        return DocumentUploadResponse(
            document=DocumentResponse.from_orm(document),
            message="URL submitted successfully and processing started"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing URL: {str(e)}"
        )

@router.get("/", response_model=List[DocumentResponse])
async def get_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50
):
    """Get user's documents."""
    documents = db.query(Document).filter(
        Document.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return [DocumentResponse.from_orm(doc) for doc in documents]

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific document."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return DocumentResponse.from_orm(document)

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document and its associated data."""
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.owner_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Delete file if it exists
        if document.file_type != "url" and os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete from vector store
        vector_store = VectorStoreService()
        await vector_store.delete_document_chunks(document_id)
        
        # Delete document and chunks (cascade will handle chunks)
        db.delete(document)
        db.commit()
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )

@router.get("/{document_id}/content")
async def get_document_content(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get document content and chunks."""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Get document chunks
    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).order_by(DocumentChunk.chunk_index).all()
    
    return {
        "document": DocumentResponse.from_orm(document),
        "content": document.content,
        "chunks": [
            {
                "id": chunk.id,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
                "page_number": chunk.page_number,
                "section_header": chunk.section_header,
                "metadata": chunk.metadata
            }
            for chunk in chunks
        ]
    }

@router.post("/{document_id}/reprocess")
async def reprocess_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reprocess a document."""
    try:
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.owner_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Update status to pending
        document.processing_status = "pending"
        db.commit()
        
        # Reprocess document
        await process_document_async(document_id, db)
        
        return {"message": "Document reprocessing started"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reprocessing document: {str(e)}"
        )

async def process_document_async(document_id: int, db: Session):
    """Process document asynchronously."""
    try:
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return
        
        # Update status
        document.processing_status = "processing"
        db.commit()
        
        # Initialize agents
        parser_agent = ParserAgent()
        embedding_agent = EmbeddingAgent()
        vector_store = VectorStoreService()
        
        # Parse document
        if document.file_type == "url":
            parse_result = await parser_agent.parse_document(
                file_path="", 
                file_type="url", 
                url=document.file_path
            )
        else:
            parse_result = await parser_agent.parse_document(
                file_path=document.file_path,
                file_type=document.file_type
            )
        
        if not parse_result.get("success"):
            document.processing_status = "failed"
            document.metadata = {"error": parse_result.get("error")}
            db.commit()
            return
        
        # Update document with parsed content
        document.content = parse_result["content"]
        document.metadata = parse_result["metadata"]
        
        # Create embeddings for chunks
        chunks_with_embeddings = await embedding_agent.batch_embed_chunks(
            parse_result["chunks"]
        )
        
        # Save chunks to database
        for i, chunk_data in enumerate(chunks_with_embeddings):
            chunk = DocumentChunk(
                document_id=document.id,
                content=chunk_data["content"],
                chunk_index=i,
                page_number=chunk_data["metadata"].get("page_number"),
                section_header=chunk_data["metadata"].get("section_header"),
                metadata=chunk_data["metadata"]
            )
            db.add(chunk)
        
        # Save chunks to vector store
        # Add document_id to each chunk's metadata
        for chunk_data in chunks_with_embeddings:
            chunk_data["metadata"]["document_id"] = document.id
            chunk_data["metadata"]["filename"] = document.original_filename
        
        chunk_ids = await vector_store.add_chunks(
            chunks_with_embeddings,
            user_id=document.owner_id
        )
        
        # Update chunk embedding IDs
        chunks = db.query(DocumentChunk).filter(
            DocumentChunk.document_id == document.id
        ).order_by(DocumentChunk.chunk_index).all()
        
        for i, chunk in enumerate(chunks):
            if i < len(chunk_ids):
                chunk.embedding_id = chunk_ids[i]
        
        # Update document status
        document.processing_status = "completed"
        db.commit()
        
    except Exception as e:
        # Update document status on error
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.processing_status = "failed"
            document.metadata = {"error": str(e)}
            db.commit()