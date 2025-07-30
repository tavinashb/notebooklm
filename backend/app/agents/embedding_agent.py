import os
import numpy as np
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
import openai
from dotenv import load_dotenv

load_dotenv()

class EmbeddingAgent:
    """
    Agent responsible for converting text chunks into vector embeddings.
    Supports both local sentence-transformers and OpenAI embedding models.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2", use_openai: bool = False):
        self.use_openai = use_openai
        self.model_name = model_name
        
        if use_openai:
            openai.api_key = os.getenv("OPENAI_API_KEY")
            if not openai.api_key:
                raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY environment variable.")
            self.embedding_model = "text-embedding-ada-002"
        else:
            # Load local sentence transformer model
            self.model = SentenceTransformer(model_name)
            self.embedding_dim = self.model.get_sentence_embedding_dimension()
    
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Create embeddings for a list of text chunks.
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        try:
            if self.use_openai:
                return await self._create_openai_embeddings(texts)
            else:
                return await self._create_local_embeddings(texts)
        except Exception as e:
            raise Exception(f"Error creating embeddings: {str(e)}")
    
    async def create_single_embedding(self, text: str) -> List[float]:
        """
        Create embedding for a single text string.
        
        Args:
            text: Text string to embed
            
        Returns:
            Embedding vector
        """
        embeddings = await self.create_embeddings([text])
        return embeddings[0] if embeddings else []
    
    async def _create_openai_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings using OpenAI API."""
        try:
            # Process in batches to handle rate limits
            batch_size = 100
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                
                response = await openai.Embedding.acreate(
                    model=self.embedding_model,
                    input=batch
                )
                
                batch_embeddings = [item['embedding'] for item in response['data']]
                all_embeddings.extend(batch_embeddings)
            
            return all_embeddings
        except Exception as e:
            raise Exception(f"Error with OpenAI embeddings: {str(e)}")
    
    async def _create_local_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings using local sentence transformer model."""
        try:
            # Clean and preprocess texts
            cleaned_texts = [self._preprocess_text(text) for text in texts]
            
            # Create embeddings
            embeddings = self.model.encode(
                cleaned_texts,
                convert_to_numpy=True,
                show_progress_bar=len(texts) > 10
            )
            
            # Convert to list format
            return embeddings.tolist()
        except Exception as e:
            raise Exception(f"Error with local embeddings: {str(e)}")
    
    def _preprocess_text(self, text: str) -> str:
        """
        Preprocess text before embedding.
        
        Args:
            text: Raw text string
            
        Returns:
            Cleaned text string
        """
        # Remove excessive whitespace
        text = " ".join(text.split())
        
        # Truncate if too long (sentence transformers have token limits)
        max_length = 512  # tokens, roughly 2000 characters
        if len(text) > max_length * 4:  # rough estimate
            text = text[:max_length * 4]
        
        return text
    
    def get_embedding_dimension(self) -> int:
        """Get the dimension of the embedding vectors."""
        if self.use_openai:
            return 1536  # OpenAI ada-002 dimension
        else:
            return self.embedding_dim
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Calculate cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Cosine similarity score between -1 and 1
        """
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except Exception as e:
            raise Exception(f"Error calculating similarity: {str(e)}")
    
    async def batch_embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Create embeddings for a batch of document chunks.
        
        Args:
            chunks: List of chunk dictionaries with 'content' and 'metadata'
            
        Returns:
            List of chunks with added 'embedding' field
        """
        if not chunks:
            return []
        
        try:
            # Extract text content from chunks
            texts = [chunk['content'] for chunk in chunks]
            
            # Create embeddings
            embeddings = await self.create_embeddings(texts)
            
            # Add embeddings to chunks
            enhanced_chunks = []
            for i, chunk in enumerate(chunks):
                enhanced_chunk = chunk.copy()
                enhanced_chunk['embedding'] = embeddings[i]
                enhanced_chunk['metadata']['embedding_model'] = self.model_name
                enhanced_chunk['metadata']['embedding_dimension'] = len(embeddings[i])
                enhanced_chunks.append(enhanced_chunk)
            
            return enhanced_chunks
        except Exception as e:
            raise Exception(f"Error in batch embedding: {str(e)}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current embedding model."""
        return {
            "model_name": self.model_name,
            "use_openai": self.use_openai,
            "embedding_dimension": self.get_embedding_dimension(),
            "model_type": "openai" if self.use_openai else "sentence-transformer"
        }