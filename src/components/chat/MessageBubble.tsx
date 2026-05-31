import React, { useState } from 'react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Check, CheckCheck, Copy, Reply, Trash2, Download } from 'lucide-react'
import Avatar from '../common/Avatar'
import { Message } from '../../types/chat.types'
import toast from 'react-hot-toast'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar?: boolean
  onDelete?: (messageId: string) => void
}

const safeTime = (date?: string | Date | null) => {
  if (!date) return '--:--'

  const parsed = new Date(date)

  // verifica se é realmente válido
  if (!(parsed instanceof Date) || isNaN(parsed.getTime())) {
    return '--:--'
  }

  try {
    return format(parsed, 'HH:mm', { locale: pt })
  } catch (err) {
    return '--:--'
  }
}


export default function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  onDelete
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const isFile = message.fileUrl
  const fileType = message.fileType?.split('/')[0]

  const copyText = () => {
    navigator.clipboard.writeText(message.content)
    toast.success('Texto copiado!')
  }

  const downloadFile = () => {
    if (message.fileUrl) {
      window.open(message.fileUrl, '_blank')
    }
  }

  return (
    <div
      className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 self-end mb-1">
          <Avatar name={message.senderName} size="sm" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${!isOwn && !showAvatar ? 'ml-10' : ''}`}>
        {!isOwn && message.senderName && !showAvatar && (
          <p className="text-xs text-gray-500 ml-2 mb-1">{message.senderName}</p>
        )}
        
        <div className="relative">
          <div
            className={`
              relative rounded-2xl px-4 py-2 break-words
              ${isOwn 
                ? 'message-bubble-sent' 
                : 'message-bubble-received shadow-sm'
              }
            `}
          >
            {isFile && fileType === 'image' && (
              <img
                src={message.fileUrl}
                alt="Imagem"
                className="max-w-full rounded-lg mb-2 cursor-pointer"
                onClick={() => window.open(message.fileUrl, '_blank')}
              />
            )}
            
            {isFile && fileType === 'video' && (
              <video
                src={message.fileUrl}
                controls
                className="max-w-full rounded-lg mb-2"
              />
            )}
            
            {isFile && fileType === 'audio' && (
              <audio src={message.fileUrl} controls className="w-full mb-2" />
            )}
            
            {message.content && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
            
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] opacity-70">
                {safeTime(message.createdAt)}
              </span>
              
              {isOwn && (
                <>
                  {message.isRead ? (
                    <CheckCheck size={14} className="text-blue-500" />
                  ) : message.deliveredAt ? (
                    <CheckCheck size={14} className="opacity-70" />
                  ) : (
                    <Check size={14} className="opacity-70" />
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Actions Menu */}
          {showActions && (
            <div className={`absolute top-0 ${isOwn ? '-left-20' : '-right-20'} flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 z-10`}>
              <button
                onClick={copyText}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Copiar"
              >
                <Copy size={14} />
              </button>
              {message.fileUrl && (
                <button
                  onClick={downloadFile}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </button>
              )}
              <button
  onClick={() => onDelete?.(message.id)}
  className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors text-red-500"
  title="Apagar"
>
  <Trash2 size={14} />
</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}