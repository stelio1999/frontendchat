import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import { GoogleLogin } from '@react-oauth/google'
import { MessageCircle, Mail, Lock } from 'lucide-react'
import Button from '../components/common/Button'
import { Input } from '../components/common/Input'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Login realizado com sucesso!')
      navigate('/')
    } catch (error) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.')
    }
  }

   
  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-chat-bg-light dark:bg-whatsapp-chat-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-whatsapp-sidebar-dark rounded-2xl shadow-xl p-8 backdrop-blur-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-whatsapp-green rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tsangano</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Bem-vindo de volta!</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
              required
            />
            
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              required
            />

            <Button type="submit" loading={isLoading} fullWidth>
              Entrar
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-whatsapp-sidebar-dark text-gray-500 dark:text-gray-400">
                ou
              </span>
            </div>
          </div>

          <GoogleLogin
  onSuccess={async (credentialResponse) => {
    try {
      const credential = credentialResponse.credential

      if (!credential) {
        toast.error('Credencial do Google não encontrada')
        return
      }

      await loginWithGoogle(credential)
      toast.success('Login com Google realizado com sucesso!')
      navigate('/')
    } catch (error) {
      toast.error('Erro ao fazer login com Google')
    }
  }}
  onError={() => {
    toast.error('Erro ao autenticar com Google')
  }}
/>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/register" className="text-whatsapp-green hover:underline font-semibold">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}