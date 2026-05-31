import React, { useState, useEffect } from 'react'
import { Search, UserPlus } from 'lucide-react'
import ContactItem from './ContactItem'
import Skeleton from '../common/Skeleton'
import api from '../../services/api'
import { User } from '../../types/user.types'
import { useChatStore } from '../../stores/chatStore'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface ContactsListProps {
  onContactSelect?: (contact: User) => void
  onAddContact?: () => void
}

export default function ContactsList({ onContactSelect, onAddContact }: ContactsListProps) {
  const [contacts, setContacts] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { setCurrentChat } = useChatStore()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/contacts')
      console.log('Contacts loaded:', response.data)
      setContacts(response.data)
    } catch (error) {
      console.error('Error loading contacts:', error)
      toast.error('Erro ao carregar contactos')
    } finally {
      setLoading(false)
    }
  }

  const handleContactClick = async (contact: User) => {
    console.log('Contact clicked:', contact)
    
    try {
      // Create or get existing chat with this contact
      const response = await api.post('/chats/private', { contactId: contact.id })
      const chat = response.data
      
      console.log('Chat created/retrieved:', chat)
      
      // Set current chat in store
      setCurrentChat(chat)
      
      // Navigate to chat page
      navigate('/chats')
      
      // Call parent callback if provided
      if (onContactSelect) {
        onContactSelect(contact)
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      toast.error('Erro ao iniciar conversa')
    }
  }

  const handleMessageClick = async (contact: User) => {
    console.log('Message button clicked for:', contact)
    await handleContactClick(contact)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
              <Skeleton width="60%" height={20} className="mb-2" />
              <Skeleton width="40%" height={16} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar contactos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
            <UserPlus size={48} strokeWidth={1} />
            <p className="mt-4 text-center">Nenhum contacto encontrado</p>
            <p className="text-sm text-center mt-2">
              {searchQuery ? 'Tente outra busca' : 'Adicione contactos para começar'}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              onClick={() => handleContactClick(contact)}
              onMessage={() => handleMessageClick(contact)}
            />
          ))
        )}
      </div>
    </div>
  )
}