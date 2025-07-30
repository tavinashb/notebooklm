from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.agents.embedding_agent import EmbeddingAgent
from app.agents.retriever_agent import RetrieverAgent
from app.services.vector_store import VectorStoreService

router = APIRouter()

# Pydantic models
class SearchRequest(BaseModel):
    query: str
    document_ids: Optional[List[int]] = None
    top_k: int = 10
    min_similarity: float = 0.3

class SearchResult(BaseModel):
    content: str
    similarity_score: float
    metadata: Dict[str, Any]
    source_info: Dict[str, Any]

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total_results: int
    processing_time: float

@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Perform semantic search across user's documents."""
    import time
    start_time = time.time()
    
    try:
        # Initialize agents
        embedding_agent = EmbeddingAgent()
        vector_store = VectorStoreService()
        retriever_agent = RetrieverAgent(embedding_agent, vector_store)
        
        # Retrieve relevant chunks
        retrieved_chunks = await retriever_agent.retrieve_relevant_chunks(
            query=search_request.query,
            user_id=current_user.id,
            document_ids=search_request.document_ids,
            top_k=search_request.top_k,
            min_similarity=search_request.min_similarity
        )
        
        # Format results
        results = []
        for chunk in retrieved_chunks:
            result = SearchResult(
                content=chunk.content,
                similarity_score=chunk.similarity_score,
                metadata=chunk.metadata,
                source_info=chunk.source_info
            )
            results.append(result)
        
        processing_time = time.time() - start_time
        
        return SearchResponse(
            query=search_request.query,
            results=results,
            total_results=len(results),
            processing_time=processing_time
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing semantic search: {str(e)}"
        )

@router.get("/quick")
async def quick_search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(5, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Quick semantic search with minimal parameters."""
    try:
        # Initialize agents
        embedding_agent = EmbeddingAgent()
        vector_store = VectorStoreService()
        retriever_agent = RetrieverAgent(embedding_agent, vector_store)
        
        # Retrieve relevant chunks
        retrieved_chunks = await retriever_agent.retrieve_relevant_chunks(
            query=q,
            user_id=current_user.id,
            top_k=limit,
            min_similarity=0.3
        )
        
        # Format results for quick response
        results = []
        for chunk in retrieved_chunks:
            results.append({
                "content": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content,
                "similarity_score": round(chunk.similarity_score, 3),
                "filename": chunk.metadata.get("filename", "Unknown"),
                "page_number": chunk.metadata.get("page_number"),
                "section_header": chunk.metadata.get("section_header")
            })
        
        return {
            "query": q,
            "results": results,
            "total": len(results)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing quick search: {str(e)}"
        )

@router.get("/suggestions")
async def search_suggestions(
    partial_query: str = Query(..., description="Partial search query"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get search suggestions based on partial query and user's documents."""
    try:
        # For now, return simple suggestions based on common patterns
        # In a full implementation, you might analyze user's document content
        # to provide more intelligent suggestions
        
        suggestions = []
        
        # Basic keyword-based suggestions
        common_queries = [
            "What is",
            "How to",
            "Why does",
            "When was",
            "Where is",
            "Who is",
            "Explain",
            "Define",
            "Compare",
            "Analyze"
        ]
        
        for prefix in common_queries:
            if prefix.lower().startswith(partial_query.lower()) or partial_query.lower() in prefix.lower():
                suggestions.append(f"{prefix} {partial_query}")
        
        # Limit suggestions
        suggestions = suggestions[:5]
        
        return {
            "partial_query": partial_query,
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating search suggestions: {str(e)}"
        )

@router.get("/stats")
async def get_search_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get search statistics for the current user."""
    try:
        # Initialize agents
        embedding_agent = EmbeddingAgent()
        vector_store = VectorStoreService()
        retriever_agent = RetrieverAgent(embedding_agent, vector_store)
        
        # Get retrieval statistics
        stats = await retriever_agent.get_retrieval_stats(current_user.id)
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving search stats: {str(e)}"
        )

@router.post("/similar-to-chunk")
async def find_similar_chunks(
    chunk_id: str,
    top_k: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find chunks similar to a specific chunk."""
    try:
        # Initialize services
        vector_store = VectorStoreService()
        
        # Get the reference chunk
        reference_chunk = await vector_store.get_chunk_by_id(chunk_id)
        if not reference_chunk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chunk not found"
            )
        
        # Check if user owns this chunk
        if reference_chunk['metadata'].get('user_id') != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Find similar chunks using the reference chunk's embedding
        if reference_chunk.get('embedding'):
            similar_chunks = await vector_store.search_similar_chunks(
                query_embedding=reference_chunk['embedding'],
                n_results=top_k + 1,  # +1 to exclude the reference chunk itself
                user_id=current_user.id
            )
            
            # Remove the reference chunk from results
            similar_chunks = [
                chunk for chunk in similar_chunks 
                if chunk['id'] != chunk_id
            ][:top_k]
        else:
            similar_chunks = []
        
        # Format results
        results = []
        for chunk in similar_chunks:
            results.append({
                "id": chunk['id'],
                "content": chunk['content'][:200] + "..." if len(chunk['content']) > 200 else chunk['content'],
                "similarity_score": round(chunk['similarity_score'], 3),
                "metadata": chunk['metadata']
            })
        
        return {
            "reference_chunk_id": chunk_id,
            "similar_chunks": results,
            "total": len(results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error finding similar chunks: {str(e)}"
        )

@router.get("/document/{document_id}/search")
async def search_within_document(
    document_id: int,
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search within a specific document."""
    try:
        # Verify document ownership
        from app.models.document import Document
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.owner_id == current_user.id
        ).first()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Initialize agents
        embedding_agent = EmbeddingAgent()
        vector_store = VectorStoreService()
        retriever_agent = RetrieverAgent(embedding_agent, vector_store)
        
        # Search within the specific document
        retrieved_chunks = await retriever_agent.retrieve_relevant_chunks(
            query=q,
            user_id=current_user.id,
            document_ids=[document_id],
            top_k=limit,
            min_similarity=0.2  # Lower threshold for document-specific search
        )
        
        # Format results
        results = []
        for chunk in retrieved_chunks:
            results.append({
                "content": chunk.content,
                "similarity_score": round(chunk.similarity_score, 3),
                "chunk_index": chunk.metadata.get("chunk_index"),
                "page_number": chunk.metadata.get("page_number"),
                "section_header": chunk.metadata.get("section_header")
            })
        
        return {
            "document_id": document_id,
            "document_title": document.title,
            "query": q,
            "results": results,
            "total": len(results)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching within document: {str(e)}"
        )