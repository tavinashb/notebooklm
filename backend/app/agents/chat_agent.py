from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.chat import ChatSession, ChatMessage
from app.models.user import User
import json
from datetime import datetime

class ChatHistoryAgent:
    """
    Agent responsible for managing chat sessions and conversation history.
    Handles session creation, message storage, and context retrieval.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.max_context_messages = 10  # Maximum messages to include in context
        
    async def create_chat_session(
        self,
        user_id: int,
        title: str = None,
        description: str = None,
        metadata: Dict[str, Any] = None
    ) -> ChatSession:
        """
        Create a new chat session for a user.
        
        Args:
            user_id: User ID
            title: Optional session title
            description: Optional session description
            metadata: Optional metadata dictionary
            
        Returns:
            Created ChatSession object
        """
        try:
            session = ChatSession(
                user_id=user_id,
                title=title or f"Chat Session {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                description=description,
                metadata=metadata or {},
                is_active=True
            )
            
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)
            
            return session
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error creating chat session: {str(e)}")
    
    async def get_user_sessions(
        self,
        user_id: int,
        active_only: bool = True,
        limit: int = 50
    ) -> List[ChatSession]:
        """
        Get chat sessions for a user.
        
        Args:
            user_id: User ID
            active_only: Whether to return only active sessions
            limit: Maximum number of sessions to return
            
        Returns:
            List of ChatSession objects
        """
        try:
            query = self.db.query(ChatSession).filter(ChatSession.user_id == user_id)
            
            if active_only:
                query = query.filter(ChatSession.is_active == True)
            
            sessions = query.order_by(ChatSession.updated_at.desc()).limit(limit).all()
            return sessions
            
        except Exception as e:
            raise Exception(f"Error retrieving user sessions: {str(e)}")
    
    async def get_session_by_id(
        self,
        session_id: int,
        user_id: int = None
    ) -> Optional[ChatSession]:
        """
        Get a specific chat session by ID.
        
        Args:
            session_id: Session ID
            user_id: Optional user ID for access control
            
        Returns:
            ChatSession object or None if not found
        """
        try:
            query = self.db.query(ChatSession).filter(ChatSession.id == session_id)
            
            if user_id:
                query = query.filter(ChatSession.user_id == user_id)
            
            return query.first()
            
        except Exception as e:
            raise Exception(f"Error retrieving session: {str(e)}")
    
    async def add_message(
        self,
        session_id: int,
        content: str,
        role: str,
        message_type: str = "text",
        metadata: Dict[str, Any] = None
    ) -> ChatMessage:
        """
        Add a message to a chat session.
        
        Args:
            session_id: Session ID
            content: Message content
            role: Message role (user, assistant, system)
            message_type: Type of message (text, citation, error)
            metadata: Optional metadata (citations, retrieved chunks, etc.)
            
        Returns:
            Created ChatMessage object
        """
        try:
            message = ChatMessage(
                session_id=session_id,
                content=content,
                role=role,
                message_type=message_type,
                metadata=metadata or {}
            )
            
            self.db.add(message)
            
            # Update session's updated_at timestamp
            session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session:
                session.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(message)
            
            return message
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error adding message: {str(e)}")
    
    async def get_session_messages(
        self,
        session_id: int,
        limit: int = None,
        include_metadata: bool = True
    ) -> List[ChatMessage]:
        """
        Get messages for a chat session.
        
        Args:
            session_id: Session ID
            limit: Optional limit on number of messages
            include_metadata: Whether to include message metadata
            
        Returns:
            List of ChatMessage objects
        """
        try:
            query = self.db.query(ChatMessage).filter(ChatMessage.session_id == session_id)
            query = query.order_by(ChatMessage.created_at.asc())
            
            if limit:
                query = query.limit(limit)
            
            messages = query.all()
            
            if not include_metadata:
                for message in messages:
                    message.metadata = {}
            
            return messages
            
        except Exception as e:
            raise Exception(f"Error retrieving session messages: {str(e)}")
    
    async def get_conversation_context(
        self,
        session_id: int,
        max_messages: int = None
    ) -> List[Dict[str, str]]:
        """
        Get conversation context for LLM prompting.
        
        Args:
            session_id: Session ID
            max_messages: Maximum number of messages to include
            
        Returns:
            List of message dictionaries with role and content
        """
        try:
            max_messages = max_messages or self.max_context_messages
            
            messages = await self.get_session_messages(
                session_id=session_id,
                limit=max_messages,
                include_metadata=False
            )
            
            # Convert to simple format for LLM
            context = []
            for message in messages[-max_messages:]:  # Get most recent messages
                context.append({
                    'role': message.role,
                    'content': message.content
                })
            
            return context
            
        except Exception as e:
            raise Exception(f"Error getting conversation context: {str(e)}")
    
    async def update_session_title(
        self,
        session_id: int,
        title: str,
        user_id: int = None
    ) -> bool:
        """
        Update the title of a chat session.
        
        Args:
            session_id: Session ID
            title: New title
            user_id: Optional user ID for access control
            
        Returns:
            True if successful
        """
        try:
            query = self.db.query(ChatSession).filter(ChatSession.id == session_id)
            
            if user_id:
                query = query.filter(ChatSession.user_id == user_id)
            
            session = query.first()
            if not session:
                return False
            
            session.title = title
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error updating session title: {str(e)}")
    
    async def deactivate_session(
        self,
        session_id: int,
        user_id: int = None
    ) -> bool:
        """
        Deactivate (soft delete) a chat session.
        
        Args:
            session_id: Session ID
            user_id: Optional user ID for access control
            
        Returns:
            True if successful
        """
        try:
            query = self.db.query(ChatSession).filter(ChatSession.id == session_id)
            
            if user_id:
                query = query.filter(ChatSession.user_id == user_id)
            
            session = query.first()
            if not session:
                return False
            
            session.is_active = False
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error deactivating session: {str(e)}")
    
    async def delete_message(
        self,
        message_id: int,
        user_id: int = None
    ) -> bool:
        """
        Delete a specific message.
        
        Args:
            message_id: Message ID
            user_id: Optional user ID for access control
            
        Returns:
            True if successful
        """
        try:
            query = self.db.query(ChatMessage).filter(ChatMessage.id == message_id)
            
            if user_id:
                # Join with session to check user ownership
                query = query.join(ChatSession).filter(ChatSession.user_id == user_id)
            
            message = query.first()
            if not message:
                return False
            
            self.db.delete(message)
            self.db.commit()
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error deleting message: {str(e)}")
    
    async def search_messages(
        self,
        user_id: int,
        query: str,
        session_id: int = None,
        limit: int = 50
    ) -> List[ChatMessage]:
        """
        Search messages by content.
        
        Args:
            user_id: User ID
            query: Search query
            session_id: Optional specific session ID
            limit: Maximum number of results
            
        Returns:
            List of matching ChatMessage objects
        """
        try:
            db_query = self.db.query(ChatMessage).join(ChatSession)
            db_query = db_query.filter(ChatSession.user_id == user_id)
            db_query = db_query.filter(ChatMessage.content.ilike(f"%{query}%"))
            
            if session_id:
                db_query = db_query.filter(ChatMessage.session_id == session_id)
            
            messages = db_query.order_by(ChatMessage.created_at.desc()).limit(limit).all()
            return messages
            
        except Exception as e:
            raise Exception(f"Error searching messages: {str(e)}")
    
    async def get_session_statistics(self, session_id: int) -> Dict[str, Any]:
        """
        Get statistics for a chat session.
        
        Args:
            session_id: Session ID
            
        Returns:
            Statistics dictionary
        """
        try:
            messages = await self.get_session_messages(session_id)
            
            stats = {
                'total_messages': len(messages),
                'user_messages': len([m for m in messages if m.role == 'user']),
                'assistant_messages': len([m for m in messages if m.role == 'assistant']),
                'total_characters': sum(len(m.content) for m in messages),
                'message_types': {}
            }
            
            # Count message types
            for message in messages:
                msg_type = message.message_type
                stats['message_types'][msg_type] = stats['message_types'].get(msg_type, 0) + 1
            
            # Get session info
            session = await self.get_session_by_id(session_id)
            if session:
                stats['session_created'] = session.created_at.isoformat()
                stats['session_updated'] = session.updated_at.isoformat()
                stats['session_title'] = session.title
            
            return stats
            
        except Exception as e:
            return {'error': str(e)}
    
    async def export_session(
        self,
        session_id: int,
        user_id: int = None,
        format: str = "json"
    ) -> Dict[str, Any]:
        """
        Export a chat session in various formats.
        
        Args:
            session_id: Session ID
            user_id: Optional user ID for access control
            format: Export format (json, markdown)
            
        Returns:
            Exported session data
        """
        try:
            session = await self.get_session_by_id(session_id, user_id)
            if not session:
                raise Exception("Session not found")
            
            messages = await self.get_session_messages(session_id)
            
            if format == "json":
                return {
                    'session': {
                        'id': session.id,
                        'title': session.title,
                        'description': session.description,
                        'created_at': session.created_at.isoformat(),
                        'updated_at': session.updated_at.isoformat()
                    },
                    'messages': [
                        {
                            'id': msg.id,
                            'role': msg.role,
                            'content': msg.content,
                            'message_type': msg.message_type,
                            'created_at': msg.created_at.isoformat(),
                            'metadata': msg.metadata
                        }
                        for msg in messages
                    ]
                }
            
            elif format == "markdown":
                md_content = f"# {session.title}\n\n"
                md_content += f"**Created:** {session.created_at.strftime('%Y-%m-%d %H:%M:%S')}\n\n"
                
                for msg in messages:
                    role_symbol = "🧑" if msg.role == "user" else "🤖"
                    md_content += f"## {role_symbol} {msg.role.title()}\n\n"
                    md_content += f"{msg.content}\n\n"
                    
                    if msg.metadata.get('citations'):
                        md_content += "**Sources:**\n"
                        for citation in msg.metadata['citations']:
                            md_content += f"- {citation.get('filename', 'Unknown')} "
                            if citation.get('page_number'):
                                md_content += f"(Page {citation['page_number']})"
                            md_content += "\n"
                        md_content += "\n"
                
                return {'content': md_content, 'format': 'markdown'}
            
            else:
                raise Exception(f"Unsupported export format: {format}")
                
        except Exception as e:
            raise Exception(f"Error exporting session: {str(e)}")
    
    def format_session_for_frontend(self, session: ChatSession) -> Dict[str, Any]:
        """
        Format session data for frontend consumption.
        
        Args:
            session: ChatSession object
            
        Returns:
            Formatted session dictionary
        """
        return {
            'id': session.id,
            'title': session.title,
            'description': session.description,
            'is_active': session.is_active,
            'created_at': session.created_at.isoformat(),
            'updated_at': session.updated_at.isoformat(),
            'metadata': session.metadata
        }
    
    def format_message_for_frontend(self, message: ChatMessage) -> Dict[str, Any]:
        """
        Format message data for frontend consumption.
        
        Args:
            message: ChatMessage object
            
        Returns:
            Formatted message dictionary
        """
        return {
            'id': message.id,
            'session_id': message.session_id,
            'content': message.content,
            'role': message.role,
            'message_type': message.message_type,
            'created_at': message.created_at.isoformat(),
            'metadata': message.metadata
        }