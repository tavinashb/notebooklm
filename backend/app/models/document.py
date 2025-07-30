from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from .base import BaseModel

class Document(BaseModel):
    __tablename__ = "documents"
    
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx, txt, url
    file_size = Column(Integer, nullable=True)
    title = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    processing_status = Column(String, default="pending")  # pending, processing, completed, failed
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(BaseModel):
    __tablename__ = "document_chunks"
    
    content = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    start_char = Column(Integer, nullable=True)
    end_char = Column(Integer, nullable=True)
    page_number = Column(Integer, nullable=True)
    section_header = Column(String, nullable=True)
    metadata = Column(JSON, nullable=True)
    embedding_id = Column(String, nullable=True)  # Reference to vector store
    
    # Foreign keys
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")