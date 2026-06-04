import React, { useState } from 'react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Check, CheckCheck, Copy, Reply, Trash2, Download, Video, Phone, ArrowRight } from 'lucide-react'
import Avatar from '../common/Avatar'
import { Message } from '../../types/chat.types'
import { useNavigate } from 'react-router-dom'
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
  if (!(parsed instanceof Date) || isNaN(parsed.getTime())) {
    return '--:--'
  }
  try {
    return format(parsed, 'HH:mm', { locale: pt })
  } catch (err) {
    return '--:--'
  }
}

// 🟢 CARD DE CHAMADA INTEGRADO
function ActiveCallCard({ chatId, callType }: { chatId: string; callType: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex justify-center my-3 w-full animate-fade-in text-white">
      <div className="bg-gradient-to-r from-gray-950 to-gray-900 border border-gray-800 shadow-2xl rounded-2xl p-5 max-w-sm w-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
          </div>
          <div className="text-left flex-1">
            <h4 className="font-semibold text-sm tracking-wide text-gray-100">
              Reunião de Grupo Iniciada
            </h4>
            <p className="text-xs text-gray-400 capitalize">
              Chamada de {callType === 'video' ? 'Vídeo' : 'Voz'} ativa
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => navigate(`/group-call/${chatId}?type=${callType}`)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-sm py-2.5 px-4 rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
        >
          Entrar na Reunião
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
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

  // 🕵️‍♂️ INTERCEPTOR DA CHAMADA ATIVA
  const rawContent = message.content || ''
  const callRegex = /\[CALL_GROUP_ACTIVE\]:([a-zA-Z0-9-]+):(video|voice)/i
  const match = rawContent.match(callRegex)

  // Se a mensagem for um comando de chamada, renderiza o card especial e ignora o balão normal
  if (match) {
    return <ActiveCallCard chatId={match[1]} callType={match[2]} />
  }

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