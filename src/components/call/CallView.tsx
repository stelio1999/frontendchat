import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  PhoneOff, Mic, MicOff, Video, VideoOff, 
  Monitor, Volume2, VolumeX 
} from 'lucide-react'
import { useCall } from '../../hooks/useCall'

export default function CallView() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  const urlCallType = searchParams.get('type') as 'voice' | 'video' | null
  
  const {
    callType: hookCallType,
    remoteStream, // ◀️ Pegamos o stream dinâmico reativo do hook
    endCall,
    toggleMute,
    toggleVideo,
    shareScreen,
    getLocalStream,
  } = useCall()

  const callType = urlCallType || hookCallType || 'voice'
  const [duration, setDuration] = useState(0)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isMutedLocal, setIsMutedLocal] = useState(false)
  const [isVideoOffLocal, setIsVideoOffLocal] = useState(false)

  // 1. Contador de Tempo da Chamada
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. Vinculação do Stream LOCAL
  useEffect(() => {
    const localStream = getLocalStream()
    if (localStream && localVideoRef.current) {
      console.log('🎥 Aplicando localStream ao elemento HTML')
      localVideoRef.current.srcObject = localStream
    }
  }, [getLocalStream, isVideoOffLocal])

  // 3. Vinculação do Stream REMOTO (Injeção em tempo de execução real)
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('🌐 Aplicando remoteStream detectado ao elemento HTML! Tracks:', remoteStream.getTracks().length)
      
      remoteVideoRef.current.srcObject = remoteStream
      
      remoteVideoRef.current.play().catch(err => {
        console.error('Erro ao reproduzir fluxo remoto automaticamente:', err)
      })
    }
  }, [remoteStream])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    endCall()
    navigate(-1)
  }

  const handleToggleMute = () => {
    const state = toggleMute()
    setIsMutedLocal(!state) // simple-peer retorna o estado da track mapeado
  }

  const handleToggleVideo = () => {
    const state = toggleVideo()
    setIsVideoOffLocal(!state)
  }

  const handleToggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = isSpeakerOn
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  if (callType === 'video') {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Remote Video (Tela cheia) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Miniatura) */}
        <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white bg-black z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Call Info */}
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1.5 z-10">
          <p className="text-white text-sm font-mono">{formatDuration(duration)}</p>
          <p className="text-white/70 text-xs">Chamada de vídeo</p>
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-10">
          <button
            onClick={handleToggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMutedLocal ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMutedLocal ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </button>
          
          <button
            onClick={handleToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOffLocal ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isVideoOffLocal ? <VideoOff size={24} className="text-white" /> : <Video size={24} className="text-white" />}
          </button>
          
          <button
            onClick={shareScreen}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            <Monitor size={24} className="text-white" />
          </button>
          
          <button
            onClick={handleToggleSpeaker}
            className="w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-all"
          >
            {isSpeakerOn ? <Volume2 size={24} className="text-white" /> : <VolumeX size={24} className="text-white" />}
          </button>
          
          <button
            onClick={handleEndCall}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg"
          >
            <PhoneOff size={24} className="text-white" />
          </button>
        </div>
      </div>
    )
  }

  // Voice Call UI
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-whatsapp-dark to-whatsapp-green z-50 flex items-center justify-center">
      {/* Elemento de áudio escondido para escutar a voz do outro usuário em chamadas de voz */}
      <audio ref={remoteVideoRef} autoPlay />

      <div className="text-center">
        <div className="mb-8">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <PhoneOff size={64} className="text-white" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Chamada de voz</h2>
        <p className="text-white/70 text-lg mb-12 font-mono">{formatDuration(duration)}</p>
        
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMutedLocal ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMutedLocal ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </button>
          
          <button
            onClick={handleEndCall}
            className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
          >
            <PhoneOff size={28} className="text-white" />
          </button>
          
          <button
            onClick={handleToggleSpeaker}
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
          >
            {isSpeakerOn ? <Volume2 size={24} className="text-white" /> : <VolumeX size={24} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}