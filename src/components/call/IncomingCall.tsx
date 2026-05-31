import React from 'react'
import { Phone, PhoneOff, Video } from 'lucide-react'
import Avatar from '../common/Avatar'

interface IncomingCallProps {
  callerName: string
  callerAvatar?: string
  isVideo?: boolean
  onAccept: () => void
  onReject: () => void
}

export default function IncomingCall({ 
  callerName, 
  callerAvatar, 
  isVideo = false, 
  onAccept, 
  onReject 
}: IncomingCallProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-slide-in">
        <div className="text-center">
          {/* Avatar */}
          <div className="mb-4 flex justify-center">
            <Avatar name={callerName} avatarUrl={callerAvatar} size="xl" />
          </div>
          
          {/* Caller Info */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {callerName}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Chamada de {isVideo ? 'vídeo' : 'voz'} recebida...
          </p>
          
          {/* Actions */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onReject}
              className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
            
            <button
              onClick={onAccept}
              className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <Phone size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}