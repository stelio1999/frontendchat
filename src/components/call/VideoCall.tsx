import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Maximize2, Minimize2 } from 'lucide-react'
import { useWebRTC } from '../../hooks/useWebRTC'
import CallControls from './CallControls'
import ScreenShare from './ScreenShare'

interface Participant {
  id: string
  name: string
  stream: MediaStream
  isLocal: boolean
}

export default function VideoCall() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // 🔥 Lemos diretamente a lista real de participantes gerenciada pelo hook
  // Dentro do seu componente VideoCall()

// Dentro do seu componente VideoCall()

const { localStream, participants, startCall, endCall } = useWebRTC(chatId!)
const hasStartedCall = useRef(false)

useEffect(() => {
  if (hasStartedCall.current) return
  hasStartedCall.current = true

  startCall()

  return () => {
    endCall()
    // Pequeno atraso na libertação da flag para mitigar a velocidade do StrictMode do React
    setTimeout(() => {
      hasStartedCall.current = false
    }, 100)
  }
}, [startCall, endCall]) // Podes manter as dependências estáveis geradas pelo useCallback

  
  // Apelido simples para manter compatibilidade com o resto do teu layout JSX abaixo
  const streamsList = participants

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) audioTrack.enabled = isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) videoTrack.enabled = isVideoOff
      setIsVideoOff(!isVideoOff)
    }
  }

  const handleEndCall = () => {
    endCall()
    navigate(-1)
  }

  return (
    <div className="fixed inset-0 bg-gray-950 text-white z-50 flex flex-col overflow-hidden select-none">
      
      {/* Top Header Barra */}
      <div className="p-4 bg-gray-900/60 backdrop-blur border-b border-gray-800 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full text-sm">
          <Users size={16} className="text-whatsapp-green" />
          <span>{streamsList.length} Online na Sala</span>
        </div>
        {expandedId && (
          <button 
            onClick={() => setExpandedId(null)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg text-xs transition"
          >
            <Minimize2 size={14} /> Voltar para Grid
          </button>
        )}
      </div>

      {/* Conteúdo Principal Dividido entre os Vídeos e a Lista Nominal */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* LADO ESQUERDO: Área Principal de Streams (Vídeos) */}
        <div className="flex-1 p-4 relative flex items-center justify-center min-h-0">
          <AnimatePresence mode="wait">
            {expandedId ? (
              <div className="w-full h-full flex gap-4">
                <div className="flex-1 relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                  {streamsList.filter(p => p.id === expandedId).map(p => (
                    <VideoWindow key={p.id} participant={p} />
                  ))}
                  <button 
                    onClick={() => setExpandedId(null)}
                    className="absolute top-4 right-4 p-2 bg-black/70 hover:bg-black/90 rounded-full transition z-20"
                  >
                    <Minimize2 size={18} />
                  </button>
                </div>

                <div className="w-48 flex flex-col gap-3 overflow-y-auto pr-1">
                  {streamsList.filter(p => p.id !== expandedId).map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setExpandedId(p.id)}
                      className="h-32 relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 cursor-pointer hover:border-whatsapp-green transition shrink-0"
                    >
                      <VideoWindow participant={p} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <motion.div 
                layout 
                className={`w-full h-full grid gap-4 max-w-6xl mx-auto ${
                  streamsList.length <= 1 ? 'grid-cols-1' : 
                  streamsList.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 
                  'grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {streamsList.map((p) => (
                  <motion.div
                    layout
                    key={p.id}
                    onClick={() => setExpandedId(p.id)}
                    className="relative bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 cursor-pointer group hover:border-gray-600 transition h-full min-h-[220px]"
                  >
                    <VideoWindow participant={p} />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="bg-black/60 p-2.5 rounded-full backdrop-blur-sm">
                        <Maximize2 size={20} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LADO DIREITO: LISTA NOMINAL DOS PARTICIPANTES */}
        <div className="w-64 bg-gray-900/40 backdrop-blur border-l border-gray-800 flex flex-col p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Users size={14} /> Participantes ({streamsList.length})
          </h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {streamsList.map((p) => (
              <div 
                key={p.id} 
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900/80 border border-gray-800/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${p.isLocal ? 'bg-whatsapp-green' : 'bg-blue-400'} shrink-0`} />
                  <p className="text-sm font-medium truncate text-gray-200">{p.name}</p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                  {p.isLocal ? 'Host' : 'Peer'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Painel Inferior */}
      <div className="p-6 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent z-10">
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={() => {}}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  )
}

function VideoWindow({ participant }: { participant: Participant }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  return (
    <div className="w-full h-full relative bg-gray-950">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal} 
        className="w-full h-full object-cover rounded-xl"
      />
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-medium border border-gray-800 z-10">
        {participant.name}
      </div>
    </div>
  )
}