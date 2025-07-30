from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from .base import BaseModel

class ChatSession(BaseModel):
    __tablename__ = "chat_sessions"
    
    title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(BaseModel):
    __tablename__ = "chat_messages"
    
    content = Column(Text, nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system
    message_type = Column(String, default="text")  # text, citation, error
    metadata = Column(JSON, nullable=True)  # Store citations, retrieved chunks, etc.
    
    # Foreign keys
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")