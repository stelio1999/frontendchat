import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Users, MessageCircle } from 'lucide-react'
import Header from '../components/layout/Header'
import Skeleton from '../components/common/Skeleton'
import Avatar from '../components/common/Avatar'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../hooks/useSocket'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import { usePresenceStore } from '../stores/PresenceStore'
import api from '../services/api' // Certifica-te de importar a tua instância do axios

export default function Chats() {
  const [filter, setFilter] = useState<'all' | 'groups' | 'private'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Captura o 'setChats' (ou a função equivalente da tua store para atualizar a lista)
  const { chats, setCurrentChat, unreadCounts } = useChatStore()
  
  const { socket } = useSocket()
  const [loading, setLoading] = useState(true)

  // Aceder ao estado de presença global
  const isOnlineUser = usePresenceStore(state => state.isOnline)

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        const response = await api.get('/chats') // Rota que aponta para o ChatController.getChats
        console.log('Conversas carregadas do servidor:', response.data)
        
        // Alimenta o Zustand. Se a tua store não tiver 'setChats', podes atualizar diretamente:
        if ((useChatStore.getState() as any).setChats) {
          (useChatStore.getState() as any).setChats(response.data)
        } else {
          useChatStore.setState({ chats: response.data })
        }
      } catch (error) {
        console.error('Erro ao carregar chats no frontend:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  // Filtragem baseada no tipo real do objeto Chat
  const filteredChats = chats.filter(chat => {
    if (filter === 'groups' && chat.type !== 'group') return false
    if (filter === 'private' && chat.type !== 'private') return false
    if (searchQuery && !chat.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="h-full">
        <Header title="Chats" />
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1">
                <Skeleton width="60%" height={20} className="mb-2" />
                <Skeleton width="40%" height={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        title="Chats" 
        onSearch={setSearchQuery}
        actions={
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`p-2 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-whatsapp-green text-white' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Filter size={20} />
            </button>
            <button 
              onClick={() => setFilter('private')}
              className={`p-2 rounded-lg transition-colors ${
                filter === 'private' ? 'bg-whatsapp-green text-white' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <MessageCircle size={20} />
            </button>
            <button 
              onClick={() => setFilter('groups')}
              className={`p-2 rounded-lg transition-colors ${
                filter === 'groups' ? 'bg-whatsapp-green text-white' : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              <Users size={20} />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
            <MessageCircle size={64} strokeWidth={1} />
            <p className="mt-4 text-lg">Nenhum chat encontrado</p>
            <p className="text-sm">Comece uma conversa com seus contactos</p>
          </div>
        ) : (
          filteredChats.map((chat, index) => {
            // Tratamento preventivo para evitar crash em objetos lastMessage vazios ou nulos
            const hasValidMessage = chat.lastMessage && chat.lastMessage.id && chat.lastMessage.createdAt;
            
            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setCurrentChat(chat)}
                className="flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700"
              >
                <Avatar 
                  name={chat.name || 'Grupo sem nome'} 
                  avatarUrl={chat.avatarUrl} 
                  size="lg" 
                  showStatus={chat.type === 'private'}
                  isOnline={chat.type === 'private' ? isOnlineUser(chat.otherUserId) : false}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {chat.name || (chat.type === 'private' ? 'Contacto' : 'Grupo')}
                    </h3>
                    {hasValidMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { 
                          addSuffix: true, 
                          locale: pt 
                        })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                      {hasValidMessage ? chat.lastMessage.content : 'Toque para começar a conversar'}
                    </p>
                    {(unreadCounts?.get(chat.id) || chat.unreadCount || 0) > 0 && (
                      <span className="bg-whatsapp-green text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center flex-shrink-0">
                        {unreadCounts?.get(chat.id) || chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}