import React, { useState, useEffect } from 'react'
import { Search, Check, UserPlus, X } from 'lucide-react'
import Avatar from '../common/Avatar'
import Button from '../common/Button'
import api from '../../services/api'
import { User } from '../../types/user.types'
import toast from 'react-hot-toast'

interface AddMembersProps {
  groupId: string
  onAdd: (userIds: string[]) => void
  onClose: () => void
}

export default function AddMembers({ groupId, onAdd, onClose }: AddMembersProps) {
  const [contacts, setContacts] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailableContacts()
  }, [groupId])

  const loadAvailableContacts = async () => {
    try {
      setLoading(true)
      console.log('Loading contacts for group:', groupId)
      
      // Buscar todos os contactos do usuário
      const contactsResponse = await api.get('/users/contacts')
      const allContacts = contactsResponse.data
      
      // Buscar membros atuais do grupo
      const membersResponse = await api.get(`/groups/${groupId}/members`)
      const currentMemberIds = membersResponse.data.map((m: any) => m.userId)
      
      // Filtrar contactos que não estão no grupo
      const availableContacts = allContacts.filter(
        (contact: User) => !currentMemberIds.includes(contact.id)
      )
      
      console.log('Available contacts:', availableContacts)
      setContacts(availableContacts)
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('Erro ao carregar contactos')
    } finally {
      setLoading(false)
    }
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) {
      toast.error('Selecione pelo menos um membro')
      return
    }
    console.log('Adding members:', selectedUsers)
    onAdd(selectedUsers)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
        <p className="mt-4 text-gray-500">Carregando contactos...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar contactos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
            autoFocus
          />
        </div>
      </div>
      
      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserPlus size={48} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum contacto disponível</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Tente outra busca' : 'Todos os seus contactos já estão no grupo'}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => toggleUser(contact.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                selectedUsers.includes(contact.id)
                  ? 'bg-whatsapp-green/10 border border-whatsapp-green'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar user={contact} size="md" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.phone}</p>
                </div>
              </div>
              {selectedUsers.includes(contact.id) && (
                <div className="w-5 h-5 bg-whatsapp-green rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          ))
        )}
      </div>
      
      {/* Footer with buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t">
        <Button variant="outline" onClick={onClose} fullWidth>
          Cancelar
        </Button>
        <Button
          onClick={handleAddMembers}
          disabled={selectedUsers.length === 0}
          fullWidth
        >
          Adicionar ({selectedUsers.length})
        </Button>
      </div>
    </div>
  )
}