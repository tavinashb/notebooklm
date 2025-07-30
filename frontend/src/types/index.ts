// User types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user: User;
}

// Document types
export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size?: number;
  title?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface DocumentChunk {
  id: number;
  content: string;
  chunk_index: number;
  page_number?: number;
  section_header?: string;
  metadata: Record<string, any>;
}

// Chat types
export interface ChatSession {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  message_type: 'text' | 'citation' | 'error';
  created_at: string;
  metadata: Record<string, any>;
}

export interface Citation {
  id: string;
  document_id: number;
  filename: string;
  page_number?: number;
  section_header?: string;
  similarity_score: number;
  excerpt: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  metadata: {
    confidence_score: number;
    retrieved_chunks_count: number;
    model_used: string;
    processing_time: number;
  };
  session_id: number;
  message_id: number;
}

// Search types
export interface SearchResult {
  content: string;
  similarity_score: number;
  metadata: Record<string, any>;
  source_info: {
    document_id?: number;
    filename?: string;
    page_number?: number;
    section_header?: string;
    chunk_index?: number;
    file_type?: string;
  };
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total_results: number;
  processing_time: number;
}

// API types
export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
}

export interface QuestionForm {
  question: string;
  session_id?: number;
  document_ids?: number[];
  include_citations?: boolean;
}

export interface DocumentUploadForm {
  file?: File;
  url?: string;
  title?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ChatState {
  currentSession?: ChatSession;
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

export interface DocumentState {
  documents: Document[];
  selectedDocument?: Document;
  isLoading: boolean;
  error?: string;
}