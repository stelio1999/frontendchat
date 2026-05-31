import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types/user.types'
import api from '../services/api'
import socket from '../services/socket'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          set({ user, token, isAuthenticated: true })
          localStorage.setItem('token', token)
          
          // 💡 CONECTA O SOCKET AQUI (Onde a variável 'token' existe)
          socket.connect(token) 
        } finally {
          set({ isLoading: false })
        }
      },

      loginWithGoogle: async (credential: string) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/google', { credential })
          const { user, token } = response.data
          
          set({ user, token, isAuthenticated: true })
          localStorage.setItem('token', token)
          
          // 💡 CONECTA O SOCKET AQUI TAMBÉM
          socket.connect(token)
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (data: any) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', data)
          const { user, token } = response.data
          
          set({ user, token, isAuthenticated: true })
          localStorage.setItem('token', token)
          
          // 💡 CONECTA O SOCKET AQUI SE O REGISTO JÁ LOGAR DIRETO
          socket.connect(token)
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('token')
        
        // 💡 DESCONECTA O SOCKET AQUI
        socket.disconnect()
      },

      checkAuth: () => {
        const token = localStorage.getItem('token')
        if (token) {
          api.get('/auth/verify').then(response => {
            set({ user: response.data.user, token, isAuthenticated: true })
            
            // 💡 RECONECTA O SOCKET SE O UTILIZADOR JÁ ESTAVA AUTENTICADO AO ABRIR O APP
            socket.connect(token)
          }).catch(() => {
            set({ user: null, token: null, isAuthenticated: false })
            socket.disconnect()
          })
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)