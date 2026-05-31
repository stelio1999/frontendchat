import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, logout, checkAuth } = useAuthStore()

  useEffect(() => {
    // Set axios default header
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  }
}