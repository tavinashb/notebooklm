import axios, { AxiosInstance, AxiosError } from 'axios'
import {
  User,
  AuthToken,
  LoginForm,
  RegisterForm,
  Document,
  ChatSession,
  ChatMessage,
  ChatResponse,
  QuestionForm,
  SearchResponse,
  SearchResult,
} from '@/types'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth-storage')
  if (authData) {
    try {
      const { state } = JSON.parse(authData)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    } catch (error) {
      console.error('Error parsing auth data:', error)
    }
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (credentials: LoginForm): Promise<AuthToken> => {
    const formData = new FormData()
    formData.append('username', credentials.email)
    formData.append('password', credentials.password)
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  },

  register: async (data: RegisterForm): Promise<AuthToken> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/auth/me', data)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },
}

// Documents API
export const documentsApi = {
  getDocuments: async (): Promise<Document[]> => {
    const response = await api.get('/documents/')
    return response.data
  },

  getDocument: async (id: number): Promise<Document> => {
    const response = await api.get(`/documents/${id}`)
    return response.data
  },

  uploadDocument: async (file: File, title?: string): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    if (title) {
      formData.append('title', title)
    }

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.document
  },

  uploadUrl: async (url: string, title?: string): Promise<Document> => {
    const response = await api.post('/documents/upload-url', { url, title })
    return response.data.document
  },

  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`)
  },

  getDocumentContent: async (id: number) => {
    const response = await api.get(`/documents/${id}/content`)
    return response.data
  },

  reprocessDocument: async (id: number): Promise<void> => {
    await api.post(`/documents/${id}/reprocess`)
  },
}

// Chat API
export const chatApi = {
  getSessions: async (): Promise<ChatSession[]> => {
    const response = await api.get('/chat/sessions')
    return response.data
  },

  getSession: async (id: number): Promise<ChatSession> => {
    const response = await api.get(`/chat/sessions/${id}`)
    return response.data
  },

  createSession: async (title?: string, description?: string): Promise<ChatSession> => {
    const response = await api.post('/chat/sessions', { title, description })
    return response.data
  },

  getSessionMessages: async (sessionId: number): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`)
    return response.data
  },

  askQuestion: async (data: QuestionForm): Promise<ChatResponse> => {
    const response = await api.post('/chat/ask', data)
    return response.data
  },

  updateSessionTitle: async (sessionId: number, title: string): Promise<void> => {
    await api.put(`/chat/sessions/${sessionId}/title`, null, {
      params: { title },
    })
  },

  deleteSession: async (sessionId: number): Promise<void> => {
    await api.delete(`/chat/sessions/${sessionId}`)
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await api.delete(`/chat/messages/${messageId}`)
  },

  exportSession: async (sessionId: number, format: string = 'json') => {
    const response = await api.get(`/chat/sessions/${sessionId}/export`, {
      params: { format },
    })
    return response.data
  },

  searchMessages: async (query: string, sessionId?: number): Promise<ChatMessage[]> => {
    const response = await api.get('/chat/search', {
      params: { query, session_id: sessionId },
    })
    return response.data
  },
}

// Search API
export const searchApi = {
  semanticSearch: async (
    query: string,
    options?: {
      document_ids?: number[]
      top_k?: number
      min_similarity?: number
    }
  ): Promise<SearchResponse> => {
    const response = await api.post('/search/semantic', {
      query,
      ...options,
    })
    return response.data
  },

  quickSearch: async (query: string, limit: number = 5): Promise<{
    query: string
    results: SearchResult[]
    total: number
  }> => {
    const response = await api.get('/search/quick', {
      params: { q: query, limit },
    })
    return response.data
  },

  searchWithinDocument: async (
    documentId: number,
    query: string,
    limit: number = 10
  ) => {
    const response = await api.get(`/search/document/${documentId}/search`, {
      params: { q: query, limit },
    })
    return response.data
  },

  getSearchSuggestions: async (partialQuery: string) => {
    const response = await api.get('/search/suggestions', {
      params: { partial_query: partialQuery },
    })
    return response.data
  },

  getSearchStats: async () => {
    const response = await api.get('/search/stats')
    return response.data
  },
}

export default api