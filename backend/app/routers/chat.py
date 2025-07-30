from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.database import get_db
from app.utils.auth import get_current_user
from app.models.user import User
from app.agents.chat_agent import ChatHistoryAgent
from app.agents.embedding_agent import EmbeddingAgent
from app.agents.retriever_agent import RetrieverAgent
from app.agents.rag_agent import RAGPromptingAgent
from app.services.vector_store import VectorStoreService

router = APIRouter()

# Pydantic models
class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    is_active: bool
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: str
    session_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    session_id: int
    content: str
    role: str
    message_type: str
    created_at: str
    metadata: Dict[str, Any]
    
    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    answer: str
    citations: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    session_id: int
    message_id: int

class QuestionRequest(BaseModel):
    question: str
    session_id: Optional[int] = None
    document_ids: Optional[List[int]] = None
    include_citations: bool = True

@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session."""
    try:
        chat_agent = ChatHistoryAgent(db)
        session = await chat_agent.create_chat_session(
            user_id=current_user.id,
            title=session_data.title,
            description=session_data.description
        )
        
        return chat_agent.format_session_for_frontend(session)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating chat session: {str(e)}"
        )

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active_only: bool = True,
    limit: int = 50
):
    """Get user's chat sessions."""
    try:
        chat_agent = ChatHistoryAgent(db)
        sessions = await chat_agent.get_user_sessions(
            user_id=current_user.id,
            active_only=active_only,
            limit=limit
        )
        
        return [chat_agent.format_session_for_frontend(session) for session in sessions]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving chat sessions: {str(e)}"
        )

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific chat session."""
    try:
        chat_agent = ChatHistoryAgent(db)
        session = await chat_agent.get_session_by_id(session_id, current_user.id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return chat_agent.format_session_for_frontend(session)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving chat session: {str(e)}"
        )

@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: Optional[int] = None
):
    """Get messages for a chat session."""
    try:
        chat_agent = ChatHistoryAgent(db)
        
        # Verify session ownership
        session = await chat_agent.get_session_by_id(session_id, current_user.id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        messages = await chat_agent.get_session_messages(
            session_id=session_id,
            limit=limit
        )
        
        return [chat_agent.format_message_for_frontend(msg) for msg in messages]
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving messages: {str(e)}"
        )

@router.post("/ask", response_model=ChatResponse)
async def ask_question(
    question_data: QuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask a question and get an AI-generated answer with citations."""
    try:
        # Initialize agents
        chat_agent = ChatHistoryAgent(db)
        embedding_agent = EmbeddingAgent()
        vector_store = VectorStoreService()
        retriever_agent = RetrieverAgent(embedding_agent, vector_store)
        rag_agent = RAGPromptingAgent()
        
        # Get or create session
        if question_data.session_id:
            session = await chat_agent.get_session_by_id(
                question_data.session_id, 
                current_user.id
            )
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found"
                )
        else:
            # Create new session
            session = await chat_agent.create_chat_session(
                user_id=current_user.id,
                title=f"Q: {question_data.question[:50]}..."
            )
        
        # Add user message
        user_message = await chat_agent.add_message(
            session_id=session.id,
            content=question_data.question,
            role="user"
        )
        
        # Retrieve relevant chunks
        retrieved_chunks = await retriever_agent.retrieve_relevant_chunks(
            query=question_data.question,
            user_id=current_user.id,
            document_ids=question_data.document_ids,
            top_k=10
        )
        
        if not retrieved_chunks:
            # No relevant content found
            answer = "I couldn't find any relevant information in your documents to answer this question. Please make sure you have uploaded documents that contain information related to your query."
            
            assistant_message = await chat_agent.add_message(
                session_id=session.id,
                content=answer,
                role="assistant",
                metadata={"no_context": True}
            )
            
            return ChatResponse(
                answer=answer,
                citations=[],
                metadata={
                    "confidence_score": 0.0,
                    "retrieved_chunks_count": 0,
                    "model_used": "none",
                    "processing_time": 0.0
                },
                session_id=session.id,
                message_id=assistant_message.id
            )
        
        # Get conversation context
        chat_history = await chat_agent.get_conversation_context(
            session_id=session.id,
            max_messages=5
        )
        
        # Generate answer using RAG
        rag_response = await rag_agent.generate_answer(
            query=question_data.question,
            retrieved_chunks=retrieved_chunks,
            chat_history=chat_history[:-1],  # Exclude the current question
            include_citations=question_data.include_citations
        )
        
        # Format response for frontend
        formatted_response = rag_agent.format_response_for_frontend(rag_response)
        
        # Add assistant message with citations
        assistant_message = await chat_agent.add_message(
            session_id=session.id,
            content=rag_response.answer,
            role="assistant",
            metadata={
                "citations": formatted_response["citations"],
                "confidence_score": rag_response.confidence_score,
                "retrieved_chunks_count": rag_response.retrieved_chunks_count,
                "model_used": rag_response.model_used,
                "processing_time": rag_response.processing_time
            }
        )
        
        return ChatResponse(
            answer=rag_response.answer,
            citations=formatted_response["citations"],
            metadata=formatted_response["metadata"],
            session_id=session.id,
            message_id=assistant_message.id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing question: {str(e)}"
        )

@router.put("/sessions/{session_id}/title")
async def update_session_title(
    session_id: int,
    title: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update chat session title."""
    try:
        chat_agent = ChatHistoryAgent(db)
        success = await chat_agent.update_session_title(
            session_id=session_id,
            title=title,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return {"message": "Session title updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating session title: {str(e)}"
        )

@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete (deactivate) a chat session."""
    try:
        chat_agent = ChatHistoryAgent(db)
        success = await chat_agent.deactivate_session(
            session_id=session_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        return {"message": "Chat session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting chat session: {str(e)}"
        )

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific message."""
    try:
        chat_agent = ChatHistoryAgent(db)
        success = await chat_agent.delete_message(
            message_id=message_id,
            user_id=current_user.id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        return {"message": "Message deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting message: {str(e)}"
        )

@router.get("/sessions/{session_id}/export")
async def export_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    format: str = "json"
):
    """Export chat session in various formats."""
    try:
        chat_agent = ChatHistoryAgent(db)
        exported_data = await chat_agent.export_session(
            session_id=session_id,
            user_id=current_user.id,
            format=format
        )
        
        return exported_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting session: {str(e)}"
        )

@router.get("/sessions/{session_id}/stats")
async def get_session_stats(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics for a chat session."""
    try:
        chat_agent = ChatHistoryAgent(db)
        
        # Verify session ownership
        session = await chat_agent.get_session_by_id(session_id, current_user.id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        stats = await chat_agent.get_session_statistics(session_id)
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving session stats: {str(e)}"
        )

@router.get("/search")
async def search_messages(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    session_id: Optional[int] = None,
    limit: int = 50
):
    """Search messages by content."""
    try:
        chat_agent = ChatHistoryAgent(db)
        messages = await chat_agent.search_messages(
            user_id=current_user.id,
            query=query,
            session_id=session_id,
            limit=limit
        )
        
        return [chat_agent.format_message_for_frontend(msg) for msg in messages]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching messages: {str(e)}"
        )