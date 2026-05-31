import React, { useState } from 'react'
import { Phone, User, Mail } from 'lucide-react'
import Button from '../common/Button'
import { Input } from '../common/Input'
import api from '../../services/api'
import toast from 'react-hot-toast'

interface AddContactProps {
  onAdd: () => void
  onClose: () => void
}

export default function AddContact({ onAdd, onClose }: AddContactProps) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!phone) {
      toast.error('Número de telefone é obrigatório')
      return
    }

    setLoading(true)
    try {
      await api.post('/users/contacts', { phone, name: name || undefined })
      toast.success('Contacto adicionado com sucesso!')
      onAdd()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao adicionar contacto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input
        label="Número de telefone *"
        placeholder="+258 84 123 4567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        icon={<Phone size={18} />}
      />
      
      <Input
        label="Nome (opcional)"
        placeholder="Como salvar este contacto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        icon={<User size={18} />}
      />
      
      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} fullWidth>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} loading={loading} fullWidth>
          Adicionar
        </Button>
      </div>
    </div>
  )
}