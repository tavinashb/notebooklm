import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthToken, LoginForm, RegisterForm } from '@/types'
import { authApi } from '@/services/api'
import toast from 'react-hot-toast'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginForm) => Promise<void>
  register: (data: RegisterForm) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginForm) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(credentials)
          set({
            user: response.user,
            token: response.access_token,
            isLoading: false,
          })
          toast.success('Successfully logged in!')
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Login failed'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      register: async (data: RegisterForm) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(data)
          set({
            user: response.user,
            token: response.access_token,
            isLoading: false,
          })
          toast.success('Account created successfully!')
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          throw error
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
        toast.success('Logged out successfully')
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const user = await authApi.getCurrentUser()
          set({ user, isLoading: false })
        } catch (error) {
          // Token is invalid, clear auth state
          set({ user: null, token: null, isLoading: false })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)