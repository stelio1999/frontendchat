import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import ChatItem from './ChatItem'
import Skeleton from '../common/Skeleton'
import { useChatStore } from '../../stores/chatStore'
import { useChatContext } from '../../contexts/ChatContext' // 💥 Importado para resolver o bloqueio do clique
import { Chat } from '../../types/chat.types'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

interface ChatListProps {
  onChatSelect?: (chat: Chat) => void
  filter?: 'all' | 'groups' | 'private'
}

export default function ChatList({ onChatSelect, filter = 'all' }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Zustand para os dados globais das conversas
  const { chats, unreadCounts } = useChatStore()
  
  // Contexto que controla a abertura da janela de Chat no Home.tsx
  const { openChat } = useChatContext()
  
  const navigate = useNavigate()

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        const response = await api.get('/chats')
        console.log('Conversas sincronizadas com sucesso:', response.data)
        
        // Alimenta o Zustand dependendo do método disponível na tua store
        if ((useChatStore.getState() as any).setChats) {
          (useChatStore.getState() as any).setChats(response.data)
        } else {
          useChatStore.setState({ chats: response.data })
        }
      } catch (error) {
        console.error('Erro ao ir buscar os chats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  // Fluxo de clique idêntico ao que usas na lista de contactos
  const handleChatClick = (chat: Chat) => {
    console.log('Chat ativo selecionado:', chat)
    
    // 1. Atualiza o Contexto (isto força o Home.tsx a renderizar o <ChatWindow />)
    openChat(chat)
    
    // 2. Redireciona para garantir que está no ecrã de conversas
    navigate('/chats')
    
    // 3. Executa a função callback se o componente pai a tiver enviado
    if (onChatSelect) {
      onChatSelect(chat)
    }
  }

  // Filtragem otimizada das conversas
  const filteredChats = chats.filter(chat => {
    if (filter === 'groups' && chat.type !== 'group') return false
    if (filter === 'private' && chat.type !== 'private') return false
    if (searchQuery && !chat.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1">
              <Skeleton width="70%" height={20} className="mb-2" />
              <Skeleton width="50%" height={16} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Barra de Pesquisa */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>
      </div>

      {/* Lista de Itens com Scroll */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredChats.map((chat, index) => {
            // Vai buscar o contador do Map (Zustand) ou da propriedade direta (Backend)
            const count = unreadCounts?.get?.(chat.id) || chat.unreadCount || 0

            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
              >
                <ChatItem
                  chat={chat}
                  unreadCount={count}
                  onClick={() => handleChatClick(chat)}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Estado Vazio (Nenhum resultado) */}
        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
            <Filter size={48} strokeWidth={1} className="text-gray-400" />
            <p className="mt-4 text-center font-medium">Nenhuma conversa encontrada</p>
            <p className="text-sm text-center text-gray-400 mt-1">
              {searchQuery ? 'Tente ajustar os termos da pesquisa' : 'Comece um novo chat na aba de contactos'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}