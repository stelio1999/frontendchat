import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import Avatar from '../common/Avatar'
import { useWebRTC } from '../../hooks/useWebRTC'

export default function VoiceCall() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  
  const { startCall, endCall, remoteStream } = useWebRTC(chatId!)

  useEffect(() => {
    startCall()
    const timer = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
    
    return () => {
      clearInterval(timer)
      endCall()
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-whatsapp-dark to-whatsapp-green z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Avatar */}
        <div className="mb-8">
          <Avatar size="xl" className="ring-4 ring-white ring-opacity-20" />
        </div>
        
        {/* Name */}
        <h2 className="text-2xl font-bold text-white mb-2">Nome do Contacto</h2>
        
        {/* Status/Duration */}
        <p className="text-white/70 text-lg mb-12">
          {duration > 0 ? formatDuration(duration) : 'A chamar...'}
        </p>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center transition-all
              ${isMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-white/20 hover:bg-white/30'
              }
            `}
          >
            {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
          
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`
              w-14 h-14 rounded-full flex items-center justify-center transition-all
              ${isSpeakerOn 
                ? 'bg-white/20 hover:bg-white/30' 
                : 'bg-gray-500/50 hover:bg-gray-600/50'
              }
            `}
          >
            {isSpeakerOn ? <Volume2 size={24} className="text-white" /> : <VolumeX size={24} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}