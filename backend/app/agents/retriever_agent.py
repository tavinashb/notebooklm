from typing import List, Dict, Any, Optional
from app.agents.embedding_agent import EmbeddingAgent
from app.services.vector_store import VectorStoreService

class RetrievedChunk:
    def __init__(self, content: str, metadata: Dict[str, Any], similarity_score: float):
        self.content = content
        self.metadata = metadata
        self.similarity_score = similarity_score
        self.source_info = self._extract_source_info()
    
    def _extract_source_info(self) -> Dict[str, Any]:
        """Extract source information for citations."""
        return {
            'document_id': self.metadata.get('document_id'),
            'filename': self.metadata.get('filename'),
            'page_number': self.metadata.get('page_number'),
            'section_header': self.metadata.get('section_header'),
            'chunk_index': self.metadata.get('chunk_index'),
            'file_type': self.metadata.get('file_type')
        }

class RetrieverAgent:
    """
    Agent responsible for retrieving relevant document chunks based on queries.
    Performs semantic search and context enhancement.
    """
    
    def __init__(self, embedding_agent: EmbeddingAgent, vector_store: VectorStoreService):
        self.embedding_agent = embedding_agent
        self.vector_store = vector_store
        
        # Configuration
        self.default_top_k = 10
        self.min_similarity_threshold = 0.3
        self.max_context_length = 8000  # characters
    
    async def retrieve_relevant_chunks(
        self,
        query: str,
        user_id: int,
        document_ids: Optional[List[int]] = None,
        top_k: int = None,
        min_similarity: float = None,
        collection_name: str = None
    ) -> List[RetrievedChunk]:
        """
        Retrieve relevant document chunks for a given query.
        
        Args:
            query: User query string
            user_id: User ID for access control
            document_ids: Optional list of specific document IDs to search
            top_k: Number of chunks to retrieve
            min_similarity: Minimum similarity threshold
            collection_name: Vector store collection name
            
        Returns:
            List of retrieved chunks with similarity scores
        """
        if not query.strip():
            return []
        
        try:
            # Use defaults if not provided
            top_k = top_k or self.default_top_k
            min_similarity = min_similarity or self.min_similarity_threshold
            
            # Create query embedding
            query_embedding = await self.embedding_agent.create_single_embedding(query)
            
            # Search vector store
            similar_chunks = await self.vector_store.search_similar_chunks(
                query_embedding=query_embedding,
                n_results=top_k * 2,  # Get more results to filter later
                collection_name=collection_name,
                user_id=user_id,
                document_ids=document_ids,
                min_similarity=min_similarity
            )
            
            # Convert to RetrievedChunk objects
            retrieved_chunks = []
            for chunk_data in similar_chunks:
                chunk = RetrievedChunk(
                    content=chunk_data['content'],
                    metadata=chunk_data['metadata'],
                    similarity_score=chunk_data['similarity_score']
                )
                retrieved_chunks.append(chunk)
            
            # Post-process and rank results
            processed_chunks = await self._post_process_chunks(retrieved_chunks, query)
            
            # Return top-k results
            return processed_chunks[:top_k]
            
        except Exception as e:
            raise Exception(f"Error retrieving chunks: {str(e)}")
    
    async def retrieve_with_context_expansion(
        self,
        query: str,
        user_id: int,
        document_ids: Optional[List[int]] = None,
        top_k: int = None,
        expand_context: bool = True
    ) -> Dict[str, Any]:
        """
        Retrieve chunks with expanded context from surrounding chunks.
        
        Args:
            query: User query string
            user_id: User ID for access control
            document_ids: Optional list of specific document IDs to search
            top_k: Number of chunks to retrieve
            expand_context: Whether to include surrounding context
            
        Returns:
            Dictionary with retrieved chunks and expanded context
        """
        try:
            # Get initial relevant chunks
            retrieved_chunks = await self.retrieve_relevant_chunks(
                query=query,
                user_id=user_id,
                document_ids=document_ids,
                top_k=top_k
            )
            
            if not expand_context:
                return {
                    'chunks': retrieved_chunks,
                    'total_chunks': len(retrieved_chunks),
                    'context_expanded': False
                }
            
            # Expand context for each chunk
            expanded_chunks = []
            for chunk in retrieved_chunks:
                expanded_chunk = await self._expand_chunk_context(chunk)
                expanded_chunks.append(expanded_chunk)
            
            return {
                'chunks': expanded_chunks,
                'total_chunks': len(expanded_chunks),
                'context_expanded': True,
                'total_context_length': sum(len(chunk.content) for chunk in expanded_chunks)
            }
            
        except Exception as e:
            raise Exception(f"Error retrieving with context expansion: {str(e)}")
    
    async def _post_process_chunks(
        self,
        chunks: List[RetrievedChunk],
        query: str
    ) -> List[RetrievedChunk]:
        """
        Post-process retrieved chunks to improve relevance and remove duplicates.
        
        Args:
            chunks: List of retrieved chunks
            query: Original query for relevance scoring
            
        Returns:
            Processed and ranked chunks
        """
        if not chunks:
            return []
        
        # Remove near-duplicate chunks
        unique_chunks = self._remove_duplicate_chunks(chunks)
        
        # Re-rank based on multiple factors
        ranked_chunks = self._rerank_chunks(unique_chunks, query)
        
        return ranked_chunks
    
    def _remove_duplicate_chunks(self, chunks: List[RetrievedChunk]) -> List[RetrievedChunk]:
        """Remove chunks with very similar content."""
        if len(chunks) <= 1:
            return chunks
        
        unique_chunks = []
        seen_content = set()
        
        for chunk in chunks:
            # Create a simplified version of content for comparison
            content_hash = self._create_content_hash(chunk.content)
            
            if content_hash not in seen_content:
                seen_content.add(content_hash)
                unique_chunks.append(chunk)
        
        return unique_chunks
    
    def _create_content_hash(self, content: str) -> str:
        """Create a hash of content for duplicate detection."""
        # Normalize content: remove extra whitespace, convert to lowercase
        normalized = ' '.join(content.lower().split())
        
        # Use first 100 characters as a simple hash
        return normalized[:100]
    
    def _rerank_chunks(self, chunks: List[RetrievedChunk], query: str) -> List[RetrievedChunk]:
        """
        Re-rank chunks based on multiple relevance factors.
        
        Args:
            chunks: List of chunks to rank
            query: Original query
            
        Returns:
            Re-ranked chunks
        """
        # Calculate additional relevance scores
        for chunk in chunks:
            chunk.relevance_score = self._calculate_relevance_score(chunk, query)
        
        # Sort by combined score (similarity + relevance)
        chunks.sort(
            key=lambda x: (x.similarity_score * 0.7 + x.relevance_score * 0.3),
            reverse=True
        )
        
        return chunks
    
    def _calculate_relevance_score(self, chunk: RetrievedChunk, query: str) -> float:
        """
        Calculate additional relevance score based on content analysis.
        
        Args:
            chunk: Retrieved chunk
            query: Original query
            
        Returns:
            Relevance score between 0 and 1
        """
        score = 0.0
        query_words = set(query.lower().split())
        content_words = set(chunk.content.lower().split())
        
        # Keyword overlap score
        if query_words and content_words:
            overlap = len(query_words.intersection(content_words))
            keyword_score = overlap / len(query_words)
            score += keyword_score * 0.4
        
        # Content length score (prefer moderate length chunks)
        content_length = len(chunk.content)
        if 200 <= content_length <= 1000:
            length_score = 1.0
        elif content_length < 200:
            length_score = content_length / 200
        else:
            length_score = max(0.5, 1000 / content_length)
        score += length_score * 0.3
        
        # Section header bonus
        if chunk.metadata.get('section_header'):
            score += 0.1
        
        # Recent chunk bonus (if we have timestamp info)
        if chunk.metadata.get('created_at'):
            score += 0.1
        
        return min(score, 1.0)
    
    async def _expand_chunk_context(self, chunk: RetrievedChunk) -> RetrievedChunk:
        """
        Expand chunk context by including surrounding chunks from the same document.
        
        Args:
            chunk: Original chunk to expand
            
        Returns:
            Chunk with expanded context
        """
        try:
            document_id = chunk.metadata.get('document_id')
            chunk_index = chunk.metadata.get('chunk_index')
            
            if not document_id or chunk_index is None:
                return chunk
            
            # Get surrounding chunks (before and after)
            context_chunks = []
            
            # Try to get 1-2 chunks before and after
            for offset in [-2, -1, 1, 2]:
                target_index = chunk_index + offset
                if target_index >= 0:
                    # This would require a method to get chunks by document and index
                    # For now, we'll keep the original chunk
                    pass
            
            # If we found context chunks, combine them
            if context_chunks:
                expanded_content = self._combine_chunks_content([chunk] + context_chunks)
                chunk.content = expanded_content
                chunk.metadata['context_expanded'] = True
                chunk.metadata['context_chunks'] = len(context_chunks)
            
            return chunk
            
        except Exception as e:
            # If context expansion fails, return original chunk
            return chunk
    
    def _combine_chunks_content(self, chunks: List[RetrievedChunk]) -> str:
        """Combine multiple chunks into a single content string."""
        # Sort chunks by their index
        sorted_chunks = sorted(
            chunks,
            key=lambda x: x.metadata.get('chunk_index', 0)
        )
        
        combined_content = ""
        for i, chunk in enumerate(sorted_chunks):
            if i > 0:
                combined_content += "\n\n"
            combined_content += chunk.content
        
        # Truncate if too long
        if len(combined_content) > self.max_context_length:
            combined_content = combined_content[:self.max_context_length] + "..."
        
        return combined_content
    
    async def get_retrieval_stats(self, user_id: int) -> Dict[str, Any]:
        """
        Get statistics about available content for retrieval.
        
        Args:
            user_id: User ID
            
        Returns:
            Statistics dictionary
        """
        try:
            stats = await self.vector_store.get_collection_stats()
            
            # Add user-specific stats if possible
            user_chunks = await self.vector_store.search_similar_chunks(
                query_embedding=[0.0] * self.embedding_agent.get_embedding_dimension(),
                n_results=1,
                user_id=user_id
            )
            
            return {
                'total_chunks': stats.get('total_chunks', 0),
                'document_types': stats.get('document_types', {}),
                'user_has_content': len(user_chunks) > 0,
                'embedding_model': self.embedding_agent.get_model_info()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'total_chunks': 0,
                'document_types': {},
                'user_has_content': False
            }