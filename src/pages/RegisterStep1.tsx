import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Phone, Calendar, Globe, User } from 'lucide-react'
import Button from '../components/common/Button'
import { Input } from '../components/common/Input'
import { useAuthStore } from '../stores/authStore'

interface Step1Data {
  phone: string
  name: string
  birthDate: string
  nationality: string
}

export default function RegisterStep1() {
  const navigate = useNavigate()
  const { register: registerField, handleSubmit, formState: { errors } } = useForm<Step1Data>()
  const [isLoading, setIsLoading] = useState(false)

  const onSubmit = async (data: Step1Data) => {
    setIsLoading(true)
    // Salvar dados temporariamente
    localStorage.setItem('tempRegister', JSON.stringify(data))
    navigate('/register/step2')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-whatsapp-chat-bg-light dark:bg-whatsapp-chat-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-whatsapp-sidebar-dark rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Criar Conta</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Passo 1 de 2 - Informações Pessoais</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Número de Celular"
              placeholder="+258 84 123 4567"
              {...registerField('phone', { required: 'Número é obrigatório' })}
              error={errors.phone?.message}
              icon={<Phone size={18} />}
            />

            <Input
              label="Nome Completo"
              placeholder="Seu nome"
              {...registerField('name', { required: 'Nome é obrigatório' })}
              error={errors.name?.message}
              icon={<User size={18} />}
            />

            <Input
              label="Data de Nascimento"
              type="date"
              {...registerField('birthDate', { required: 'Data de nascimento é obrigatória' })}
              error={errors.birthDate?.message}
              icon={<Calendar size={18} />}
            />

            <Input
              label="Nacionalidade"
              placeholder="Moçambique"
              {...registerField('nationality', { required: 'Nacionalidade é obrigatória' })}
              error={errors.nationality?.message}
              icon={<Globe size={18} />}
            />

            <Button type="submit" loading={isLoading} fullWidth>
              Próximo
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}