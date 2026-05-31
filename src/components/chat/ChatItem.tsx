import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import Avatar from '../common/Avatar'
import { Chat } from '../../types/chat.types'
import { usePresenceStore } from '../../stores/PresenceStore'




interface ChatItemProps {
  chat: Chat
  unreadCount: number
  onClick: () => void
}

export default function ChatItem({ chat, unreadCount, onClick }: ChatItemProps) {
  const lastMessage = chat.lastMessage
  const isGroup = chat.type === 'group'

  const isOnline = usePresenceStore(state =>
    state.isOnline(chat.otherUserId)
  )
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-700"
    >
<Avatar
  name={chat.name}
  avatarUrl={chat.avatarUrl}
  size="lg"
  showStatus
  isOnline={isOnline}
/>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {chat.name}
            {isGroup && <span className="text-xs text-gray-500 ml-1">(grupo)</span>}
          </h3>
          {lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(lastMessage.createdAt), {
                addSuffix: true,
                locale: pt
              })}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {lastMessage?.content || 'Toque para começar a conversar'}
          </p>
          {unreadCount > 0 && (
            <span className="bg-whatsapp-green text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}