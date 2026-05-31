import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter } from 'lucide-react'
import ChatItem from './ChatItem'
import Skeleton from '../common/Skeleton'
import { useChatStore } from '../../stores/chatStore'
import { Chat } from '../../types/chat.types'

interface ChatListProps {
  onChatSelect: (chat: Chat) => void
  filter?: 'all' | 'groups' | 'private'
}

export default function ChatList({ onChatSelect, filter = 'all' }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const { chats, unreadCounts } = useChatStore()

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
  }, [])

  const filteredChats = chats.filter(chat => {
    if (filter !== 'all' && chat.type !== filter) return false
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
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <ChatItem
                chat={chat}
                unreadCount={unreadCounts.get(chat.id) || 0}
                onClick={() => onChatSelect(chat)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredChats.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
            <Filter size={48} strokeWidth={1} />
            <p className="mt-4 text-center">Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}