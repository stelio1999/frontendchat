import React from 'react'
import { Phone, Video, PhoneOff } from 'lucide-react'
import Avatar from '../common/Avatar'

interface IncomingCallNotificationProps {
  callerName: string
  callerAvatar?: string
  type: 'voice' | 'video'
  onAccept: () => void
  onReject: () => void
}

export default function IncomingCallNotification({
  callerName,
  callerAvatar,
  type,
  onAccept,
  onReject,
}: IncomingCallNotificationProps) {
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-slide-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-whatsapp-green p-4 text-white">
          <p className="text-sm font-medium">Chamada recebida</p>
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={callerName} avatarUrl={callerAvatar} size="lg" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{callerName}</h3>
              <p className="text-sm text-gray-500">
                Chamada de {type === 'video' ? 'vídeo' : 'voz'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onAccept}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
            >
              {type === 'video' ? <Video size={20} /> : <Phone size={20} />}
              Atender
            </button>
            <button
              onClick={onReject}
              className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
            >
              <PhoneOff size={20} />
              Recusar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}