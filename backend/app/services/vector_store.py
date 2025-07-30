import os
import chromadb
from chromadb.config import Settings
from typing import List, Dict, Any, Optional, Tuple
import uuid
from dotenv import load_dotenv

load_dotenv()

class VectorStoreService:
    """
    Service for managing vector storage using ChromaDB.
    Handles storing, retrieving, and searching document embeddings.
    """
    
    def __init__(self):
        self.persist_directory = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Default collection name
        self.default_collection_name = "document_chunks"
        
    def get_or_create_collection(self, collection_name: str = None) -> chromadb.Collection:
        """Get or create a ChromaDB collection."""
        if not collection_name:
            collection_name = self.default_collection_name
            
        try:
            collection = self.client.get_or_create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity
            )
            return collection
        except Exception as e:
            raise Exception(f"Error creating collection: {str(e)}")
    
    async def add_chunks(
        self,
        chunks: List[Dict[str, Any]],
        collection_name: str = None,
        user_id: int = None
    ) -> List[str]:
        """
        Add document chunks with embeddings to the vector store.
        
        Args:
            chunks: List of chunks with 'content', 'embedding', and 'metadata'
            collection_name: Name of the collection to add to
            user_id: User ID for access control
            
        Returns:
            List of chunk IDs that were added
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            
            chunk_ids = []
            documents = []
            embeddings = []
            metadatas = []
            
            for chunk in chunks:
                # Generate unique ID for chunk
                chunk_id = str(uuid.uuid4())
                chunk_ids.append(chunk_id)
                
                # Prepare data for ChromaDB
                documents.append(chunk['content'])
                embeddings.append(chunk['embedding'])
                
                # Prepare metadata
                metadata = chunk.get('metadata', {}).copy()
                if user_id:
                    metadata['user_id'] = user_id
                metadata['chunk_id'] = chunk_id
                metadatas.append(metadata)
            
            # Add to collection
            collection.add(
                ids=chunk_ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )
            
            return chunk_ids
        except Exception as e:
            raise Exception(f"Error adding chunks to vector store: {str(e)}")
    
    async def search_similar_chunks(
        self,
        query_embedding: List[float],
        n_results: int = 10,
        collection_name: str = None,
        user_id: int = None,
        document_ids: List[int] = None,
        min_similarity: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using vector similarity.
        
        Args:
            query_embedding: Query vector embedding
            n_results: Number of results to return
            collection_name: Name of collection to search
            user_id: Filter by user ID
            document_ids: Filter by specific document IDs
            min_similarity: Minimum similarity threshold
            
        Returns:
            List of similar chunks with metadata and similarity scores
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            
            # Build where clause for filtering
            where_clause = {}
            if user_id:
                where_clause['user_id'] = user_id
            if document_ids:
                where_clause['document_id'] = {"$in": document_ids}
            
            # Perform similarity search
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause if where_clause else None,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Process results
            similar_chunks = []
            if results['ids'] and results['ids'][0]:
                for i in range(len(results['ids'][0])):
                    # Convert distance to similarity score (ChromaDB returns cosine distance)
                    distance = results['distances'][0][i]
                    similarity = 1 - distance  # Convert distance to similarity
                    
                    if similarity >= min_similarity:
                        chunk = {
                            'id': results['ids'][0][i],
                            'content': results['documents'][0][i],
                            'metadata': results['metadatas'][0][i],
                            'similarity_score': similarity,
                            'distance': distance
                        }
                        similar_chunks.append(chunk)
            
            return similar_chunks
        except Exception as e:
            raise Exception(f"Error searching vector store: {str(e)}")
    
    async def delete_chunks(
        self,
        chunk_ids: List[str],
        collection_name: str = None
    ) -> bool:
        """
        Delete chunks from the vector store.
        
        Args:
            chunk_ids: List of chunk IDs to delete
            collection_name: Name of collection
            
        Returns:
            True if successful
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            collection.delete(ids=chunk_ids)
            return True
        except Exception as e:
            raise Exception(f"Error deleting chunks: {str(e)}")
    
    async def delete_document_chunks(
        self,
        document_id: int,
        collection_name: str = None
    ) -> bool:
        """
        Delete all chunks belonging to a specific document.
        
        Args:
            document_id: Document ID
            collection_name: Name of collection
            
        Returns:
            True if successful
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            
            # Find all chunks for this document
            results = collection.get(
                where={"document_id": document_id},
                include=['ids']
            )
            
            if results['ids']:
                collection.delete(ids=results['ids'])
            
            return True
        except Exception as e:
            raise Exception(f"Error deleting document chunks: {str(e)}")
    
    async def get_chunk_by_id(
        self,
        chunk_id: str,
        collection_name: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific chunk by ID.
        
        Args:
            chunk_id: Chunk ID
            collection_name: Name of collection
            
        Returns:
            Chunk data or None if not found
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            
            results = collection.get(
                ids=[chunk_id],
                include=['documents', 'metadatas', 'embeddings']
            )
            
            if results['ids'] and results['ids'][0]:
                return {
                    'id': results['ids'][0],
                    'content': results['documents'][0],
                    'metadata': results['metadatas'][0],
                    'embedding': results['embeddings'][0] if results['embeddings'] else None
                }
            
            return None
        except Exception as e:
            raise Exception(f"Error getting chunk: {str(e)}")
    
    async def get_collection_stats(self, collection_name: str = None) -> Dict[str, Any]:
        """
        Get statistics about a collection.
        
        Args:
            collection_name: Name of collection
            
        Returns:
            Collection statistics
        """
        try:
            collection = self.get_or_create_collection(collection_name)
            
            # Get total count
            total_count = collection.count()
            
            # Get sample of metadata to analyze
            sample_results = collection.peek(limit=100)
            
            # Analyze document types and users
            document_types = {}
            users = set()
            
            if sample_results['metadatas']:
                for metadata in sample_results['metadatas']:
                    # Count file types
                    file_type = metadata.get('file_type', 'unknown')
                    document_types[file_type] = document_types.get(file_type, 0) + 1
                    
                    # Count users
                    user_id = metadata.get('user_id')
                    if user_id:
                        users.add(user_id)
            
            return {
                'collection_name': collection_name or self.default_collection_name,
                'total_chunks': total_count,
                'document_types': document_types,
                'unique_users': len(users),
                'sample_size': len(sample_results['metadatas']) if sample_results['metadatas'] else 0
            }
        except Exception as e:
            raise Exception(f"Error getting collection stats: {str(e)}")
    
    def reset_collection(self, collection_name: str = None) -> bool:
        """
        Reset (delete all data from) a collection.
        
        Args:
            collection_name: Name of collection to reset
            
        Returns:
            True if successful
        """
        try:
            if not collection_name:
                collection_name = self.default_collection_name
                
            self.client.delete_collection(name=collection_name)
            return True
        except Exception as e:
            # Collection might not exist, which is fine
            return True
    
    def list_collections(self) -> List[str]:
        """List all available collections."""
        try:
            collections = self.client.list_collections()
            return [col.name for col in collections]
        except Exception as e:
            raise Exception(f"Error listing collections: {str(e)}")