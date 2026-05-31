import React, { useState } from 'react'
import { UserPlus, ArrowLeft } from 'lucide-react'
import Header from '../components/layout/Header'
import ContactsList from '../components/contacts/ContactsList'
import AddContact from '../components/contacts/AddContact'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import { User } from '../types/user.types'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useChatContext } from '../contexts/ChatContext'

export default function Contacts() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { openChat, isChatOpen, closeChat } = useChatContext()

  /**
   * Abrir chat com contacto
   */
  const handleContactSelect = async (contact: User) => {
    try {
      toast.loading('Abrindo conversa...', { id: 'opening-chat' })

      const response = await api.post('/chats/private', {
        contactId: contact.id,
      })

      const chat = response.data

      openChat({
        ...chat,
        name: contact.name,
        participants: [contact],
        type: 'private',
      })

      toast.success(`Conversa com ${contact.name} aberta`, {
        id: 'opening-chat',
      })
    } catch (error) {
      console.error('Error opening chat:', error)
      toast.error('Erro ao iniciar conversa', {
        id: 'opening-chat',
      })
    }
  }

  return (
    <div className="h-full flex flex-col relative">

      {/* HEADER (só quando não está em chat mobile overlay) */}
      {!isChatOpen && (
        <>
          <Header
            title="Contactos"
            actions={
              <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                <UserPlus size={18} className="mr-1" />
                Adicionar
              </Button>
            }
          />

          <ContactsList onContactSelect={handleContactSelect} />
        </>
      )}

      {/* BOTÃO VOLTAR (mobile only) */}
      {isChatOpen && (
        <>
          <div className="md:hidden bg-white dark:bg-gray-800 p-2 border-b">
            <button
              onClick={closeChat}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft size={20} />
              <span>Voltar para contactos</span>
            </button>
          </div>
        </>
      )}

      {/* MODAL ADD CONTACT */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Adicionar Contacto"
      >
        <AddContact
          onAdd={() => {
            setIsAddModalOpen(false)
            window.location.reload()
          }}
          onClose={() => setIsAddModalOpen(false)}
        />
      </Modal>
    </div>
  )
}