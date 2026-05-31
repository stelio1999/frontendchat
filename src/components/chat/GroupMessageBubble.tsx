import React from 'react'
import { Message } from '../../types/chat.types'
import MessageBubble from './MessageBubble'

interface GroupMessageBubbleProps {
  message: Message
  isOwn: boolean
  showSenderName?: boolean
  senderName?: string
}

export default function GroupMessageBubble({ 
  message, 
  isOwn, 
  showSenderName = true,
  senderName 
}: GroupMessageBubbleProps) {
  return (
    <div className="relative">
      {showSenderName && !isOwn && senderName && (
        <div className="text-xs text-gray-500 mb-1 ml-2">
          {senderName}
        </div>
      )}
      <MessageBubble message={message} isOwn={isOwn} />
    </div>
  )
}