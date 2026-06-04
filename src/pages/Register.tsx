import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import Button from '../components/common/Button'
import { useAuthStore } from '../stores/authStore'

export default function Register() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-chat-bg-light dark:bg-whatsapp-chat-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-whatsapp-sidebar-dark rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-whatsapp-green rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Bem-vindo ao Tsangano
          </h1>
          
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Conecte-se com amigos e familiares em tempo real
          </p>
          
          <div className="space-y-3">
            <Button onClick={() => navigate('/register/step1')} fullWidth>
              Começar
            </Button>
            
            <p className="text-sm text-gray-500">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-whatsapp-green hover:underline font-semibold"
              >
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}