import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, CheckCircle } from 'lucide-react'
import Button from '../components/common/Button'
import { Input } from '../components/common/Input'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

interface Step2Data {
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterStep2() {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [tempData, setTempData] = useState<any>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step2Data>()
  const password = watch('password')

  useEffect(() => {
    const data = localStorage.getItem('tempRegister')
    if (!data) {
      navigate('/register')
      return
    }
    setTempData(JSON.parse(data))
  }, [navigate])

  const onSubmit = async (data: Step2Data) => {
    try {
      await registerUser({
        ...tempData,
        email: data.email,
        password: data.password,
      })
      toast.success('Cadastro realizado com sucesso!')
      localStorage.removeItem('tempRegister')
      navigate('/')
    } catch (error) {
      toast.error('Erro ao realizar cadastro')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-chat-bg-light dark:bg-whatsapp-chat-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-whatsapp-sidebar-dark rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verificar Email</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Passo 2 de 2 - Informações de Acesso</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              {...register('email', { 
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              error={errors.email?.message}
              icon={<Mail size={18} />}
            />

            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              {...register('password', { 
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter no mínimo 6 caracteres'
                }
              })}
              error={errors.password?.message}
              icon={<Lock size={18} />}
            />

            <Input
              label="Confirmar Senha"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Confirme sua senha',
                validate: value => value === password || 'As senhas não coincidem'
              })}
              error={errors.confirmPassword?.message}
              icon={<CheckCircle size={18} />}
            />

            <Button type="submit" loading={isLoading} fullWidth>
              Finalizar Cadastro
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}