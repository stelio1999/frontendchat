import api from './api'

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
  phone: string
  birthDate: string
  nationality: string
}

export const authService = {
  async login(data: LoginData) {
    const response = await api.post('/auth/login', data)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  async loginWithGoogle(credential: string) {
    const response = await api.post('/auth/google', { credential })
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  async verifyToken() {
    const response = await api.get('/auth/verify')
    return response.data
  },

  logout() {
    localStorage.removeItem('token')
  },
}