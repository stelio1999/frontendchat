import React from 'react'
import { MessageCircle, MoreVertical } from 'lucide-react'
import Avatar from '../common/Avatar'
import { User } from '../../types/user.types'

interface ContactItemProps {
  contact: User
  onClick: () => void
  onMessage?: () => void
}

export default function ContactItem({ contact, onClick, onMessage }: ContactItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onMessage) {
      onMessage()
    }
  }

  return (
    <div 
      onClick={handleClick}
      className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any)
        }
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <Avatar user={contact} size="lg" showStatus />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
          <p className="text-sm text-gray-500">{contact.phone}</p>
          {contact.status && (
            <p className="text-xs text-gray-400">{contact.status}</p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onMessage && (
          <button
            onClick={handleMessageClick}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Enviar mensagem"
          >
            <MessageCircle size={18} className="text-whatsapp-green" />
          </button>
        )}
        <button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Menu options
          }}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <MoreVertical size={18} className="text-gray-500" />
        </button>
      </div>
    </div>
  )
}