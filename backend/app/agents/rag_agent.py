import os
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import openai
import anthropic
from dotenv import load_dotenv

from app.agents.retriever_agent import RetrievedChunk

load_dotenv()

@dataclass
class Citation:
    chunk_id: str
    document_id: int
    filename: str
    page_number: Optional[int]
    section_header: Optional[str]
    similarity_score: float
    excerpt: str  # Short excerpt from the chunk

@dataclass
class RAGResponse:
    answer: str
    citations: List[Citation]
    confidence_score: float
    retrieved_chunks_count: int
    model_used: str
    processing_time: float

class RAGPromptingAgent:
    """
    Agent responsible for generating answers using retrieved context and LLM.
    Handles prompt engineering, LLM integration, and citation formatting.
    """
    
    def __init__(self, model_provider: str = "openai", model_name: str = None):
        self.model_provider = model_provider.lower()
        
        # Initialize LLM clients
        if self.model_provider == "openai":
            openai.api_key = os.getenv("OPENAI_API_KEY")
            if not openai.api_key:
                raise ValueError("OpenAI API key not found")
            self.model_name = model_name or "gpt-4"
        elif self.model_provider == "anthropic":
            self.anthropic_client = anthropic.Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )
            self.model_name = model_name or "claude-3-sonnet-20240229"
        else:
            raise ValueError(f"Unsupported model provider: {model_provider}")
        
        # Configuration
        self.max_context_length = 12000  # characters
        self.max_response_tokens = 1000
        self.temperature = 0.1  # Low temperature for factual responses
        
    async def generate_answer(
        self,
        query: str,
        retrieved_chunks: List[RetrievedChunk],
        chat_history: Optional[List[Dict[str, str]]] = None,
        include_citations: bool = True
    ) -> RAGResponse:
        """
        Generate an answer using retrieved context and LLM.
        
        Args:
            query: User question
            retrieved_chunks: List of relevant document chunks
            chat_history: Previous conversation context
            include_citations: Whether to include citations in response
            
        Returns:
            RAGResponse with answer, citations, and metadata
        """
        import time
        start_time = time.time()
        
        try:
            # Prepare context from retrieved chunks
            context = self._prepare_context(retrieved_chunks)
            
            # Build the prompt
            prompt = self._build_prompt(query, context, chat_history)
            
            # Generate response using LLM
            raw_response = await self._call_llm(prompt)
            
            # Parse response and extract citations
            answer, citations = self._parse_response_with_citations(
                raw_response, retrieved_chunks, include_citations
            )
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(
                answer, retrieved_chunks, query
            )
            
            processing_time = time.time() - start_time
            
            return RAGResponse(
                answer=answer,
                citations=citations,
                confidence_score=confidence_score,
                retrieved_chunks_count=len(retrieved_chunks),
                model_used=f"{self.model_provider}:{self.model_name}",
                processing_time=processing_time
            )
            
        except Exception as e:
            raise Exception(f"Error generating RAG response: {str(e)}")
    
    def _prepare_context(self, chunks: List[RetrievedChunk]) -> str:
        """
        Prepare context string from retrieved chunks.
        
        Args:
            chunks: List of retrieved chunks
            
        Returns:
            Formatted context string
        """
        if not chunks:
            return "No relevant context found."
        
        context_parts = []
        current_length = 0
        
        for i, chunk in enumerate(chunks):
            # Create chunk reference
            chunk_ref = f"[{i+1}]"
            
            # Format chunk with metadata
            chunk_text = f"{chunk_ref} "
            
            # Add source info
            source_info = []
            if chunk.metadata.get('filename'):
                source_info.append(f"Source: {chunk.metadata['filename']}")
            if chunk.metadata.get('page_number'):
                source_info.append(f"Page: {chunk.metadata['page_number']}")
            if chunk.metadata.get('section_header'):
                source_info.append(f"Section: {chunk.metadata['section_header']}")
            
            if source_info:
                chunk_text += f"({', '.join(source_info)})\n"
            
            chunk_text += chunk.content + "\n\n"
            
            # Check if adding this chunk would exceed max length
            if current_length + len(chunk_text) > self.max_context_length:
                break
            
            context_parts.append(chunk_text)
            current_length += len(chunk_text)
        
        return "".join(context_parts)
    
    def _build_prompt(
        self,
        query: str,
        context: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Build the complete prompt for the LLM.
        
        Args:
            query: User question
            context: Retrieved context
            chat_history: Previous conversation
            
        Returns:
            Complete prompt string
        """
        system_prompt = """You are an AI assistant that answers questions based on provided document context. 

INSTRUCTIONS:
1. Answer questions using ONLY the information provided in the context below
2. If the context doesn't contain enough information to answer the question, say so clearly
3. Include specific references to sources using the format [1], [2], etc. that correspond to the numbered sources in the context
4. Be precise and factual - don't make assumptions or add information not in the context
5. If multiple sources support a point, reference all relevant sources
6. Structure your answer clearly with proper citations

CONTEXT:
{context}

QUESTION: {question}

Please provide a comprehensive answer with proper citations using the format [1], [2], etc."""
        
        # Add chat history if provided
        if chat_history:
            history_text = "\n\nPREVIOUS CONVERSATION:\n"
            for msg in chat_history[-5:]:  # Include last 5 messages
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                history_text += f"{role.upper()}: {content}\n"
            system_prompt = system_prompt.replace("QUESTION:", history_text + "\nCURRENT QUESTION:")
        
        return system_prompt.format(context=context, question=query)
    
    async def _call_llm(self, prompt: str) -> str:
        """
        Call the configured LLM with the prompt.
        
        Args:
            prompt: Complete prompt string
            
        Returns:
            LLM response text
        """
        try:
            if self.model_provider == "openai":
                response = await openai.ChatCompletion.acreate(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=self.max_response_tokens,
                    temperature=self.temperature,
                    stop=None
                )
                return response.choices[0].message.content.strip()
            
            elif self.model_provider == "anthropic":
                response = await self.anthropic_client.messages.create(
                    model=self.model_name,
                    max_tokens=self.max_response_tokens,
                    temperature=self.temperature,
                    messages=[{"role": "user", "content": prompt}]
                )
                return response.content[0].text.strip()
            
            else:
                raise ValueError(f"Unsupported model provider: {self.model_provider}")
                
        except Exception as e:
            raise Exception(f"Error calling LLM: {str(e)}")
    
    def _parse_response_with_citations(
        self,
        response: str,
        retrieved_chunks: List[RetrievedChunk],
        include_citations: bool
    ) -> Tuple[str, List[Citation]]:
        """
        Parse LLM response and extract citations.
        
        Args:
            response: Raw LLM response
            retrieved_chunks: Original retrieved chunks
            include_citations: Whether to process citations
            
        Returns:
            Tuple of (cleaned_answer, citations_list)
        """
        if not include_citations:
            return response, []
        
        citations = []
        
        # Find citation references in the response [1], [2], etc.
        import re
        citation_pattern = r'\[(\d+)\]'
        citation_matches = re.findall(citation_pattern, response)
        
        # Create citation objects for referenced chunks
        for match in citation_matches:
            chunk_index = int(match) - 1  # Convert to 0-based index
            
            if 0 <= chunk_index < len(retrieved_chunks):
                chunk = retrieved_chunks[chunk_index]
                
                # Create excerpt (first 150 characters)
                excerpt = chunk.content[:150]
                if len(chunk.content) > 150:
                    excerpt += "..."
                
                citation = Citation(
                    chunk_id=chunk.metadata.get('chunk_id', f"chunk_{chunk_index}"),
                    document_id=chunk.metadata.get('document_id', 0),
                    filename=chunk.metadata.get('filename', 'Unknown'),
                    page_number=chunk.metadata.get('page_number'),
                    section_header=chunk.metadata.get('section_header'),
                    similarity_score=chunk.similarity_score,
                    excerpt=excerpt
                )
                
                # Avoid duplicate citations
                if not any(c.chunk_id == citation.chunk_id for c in citations):
                    citations.append(citation)
        
        return response, citations
    
    def _calculate_confidence_score(
        self,
        answer: str,
        retrieved_chunks: List[RetrievedChunk],
        query: str
    ) -> float:
        """
        Calculate confidence score for the generated answer.
        
        Args:
            answer: Generated answer
            retrieved_chunks: Retrieved chunks used for context
            query: Original query
            
        Returns:
            Confidence score between 0 and 1
        """
        if not retrieved_chunks:
            return 0.1
        
        # Base score from chunk similarities
        avg_similarity = sum(chunk.similarity_score for chunk in retrieved_chunks) / len(retrieved_chunks)
        
        # Adjust based on answer characteristics
        confidence = avg_similarity
        
        # Boost if answer contains citations
        import re
        citation_count = len(re.findall(r'\[\d+\]', answer))
        if citation_count > 0:
            confidence += 0.1
        
        # Reduce if answer is very short or contains uncertainty phrases
        uncertainty_phrases = [
            "i don't know", "unclear", "not sure", "might be", "possibly",
            "not enough information", "cannot determine"
        ]
        
        if any(phrase in answer.lower() for phrase in uncertainty_phrases):
            confidence -= 0.2
        
        if len(answer.split()) < 10:
            confidence -= 0.1
        
        return max(0.0, min(1.0, confidence))
    
    async def generate_follow_up_questions(
        self,
        query: str,
        answer: str,
        retrieved_chunks: List[RetrievedChunk]
    ) -> List[str]:
        """
        Generate relevant follow-up questions based on the context.
        
        Args:
            query: Original query
            answer: Generated answer
            retrieved_chunks: Retrieved context chunks
            
        Returns:
            List of follow-up questions
        """
        try:
            # Build prompt for follow-up questions
            context_summary = self._summarize_context(retrieved_chunks)
            
            followup_prompt = f"""Based on the following question, answer, and available context, generate 3-5 relevant follow-up questions that a user might ask.

ORIGINAL QUESTION: {query}

ANSWER: {answer}

AVAILABLE CONTEXT TOPICS: {context_summary}

Generate follow-up questions that:
1. Explore related topics mentioned in the context
2. Ask for more specific details about points mentioned in the answer
3. Connect to related concepts that might interest the user

Provide only the questions, one per line, without numbering or bullets."""

            response = await self._call_llm(followup_prompt)
            
            # Parse questions from response
            questions = [q.strip() for q in response.split('\n') if q.strip()]
            return questions[:5]  # Limit to 5 questions
            
        except Exception as e:
            # Return empty list if follow-up generation fails
            return []
    
    def _summarize_context(self, chunks: List[RetrievedChunk]) -> str:
        """Summarize the main topics available in the context."""
        topics = set()
        
        for chunk in chunks:
            # Extract potential topics from section headers
            if chunk.metadata.get('section_header'):
                topics.add(chunk.metadata['section_header'])
            
            # Extract topics from filename
            if chunk.metadata.get('filename'):
                filename = chunk.metadata['filename'].replace('.pdf', '').replace('.docx', '')
                topics.add(filename)
        
        return ', '.join(list(topics)[:10])  # Limit to 10 topics
    
    def format_response_for_frontend(self, rag_response: RAGResponse) -> Dict[str, Any]:
        """
        Format RAG response for frontend consumption.
        
        Args:
            rag_response: RAG response object
            
        Returns:
            Dictionary formatted for frontend
        """
        return {
            'answer': rag_response.answer,
            'citations': [
                {
                    'id': citation.chunk_id,
                    'document_id': citation.document_id,
                    'filename': citation.filename,
                    'page_number': citation.page_number,
                    'section_header': citation.section_header,
                    'similarity_score': round(citation.similarity_score, 3),
                    'excerpt': citation.excerpt
                }
                for citation in rag_response.citations
            ],
            'metadata': {
                'confidence_score': round(rag_response.confidence_score, 3),
                'retrieved_chunks_count': rag_response.retrieved_chunks_count,
                'model_used': rag_response.model_used,
                'processing_time': round(rag_response.processing_time, 2)
            }
        }