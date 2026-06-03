import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Maximize2, Minimize2 } from 'lucide-react'
import { useWebRTC } from '../../hooks/useWebRTC'
import CallControls from './CallControls'
import api from '../../services/api' // ◀️ Importa a tua instância configurada do Axios
import toast from 'react-hot-toast'

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
  
  const { localStream, participants, startCall, endCall } = useWebRTC(chatId!)
  const hasStartedCall = useRef(false)

  // 🎙️ REFERÊNCIAS PARA A GRAVAÇÃO DO ÁUDIO DA REUNIÃO
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mixStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (hasStartedCall.current) return
    hasStartedCall.current = true

    startCall()

    return () => {
      // Executa ao desmontar o componente de forma segura
      handleFinalizeRecording()
      endCall()
      setTimeout(() => {
        hasStartedCall.current = false
      }, 100)
    }
  }, [startCall, endCall])

  // 🎙️ INICIAR GRAVAÇÃO MISTURANDO AS FAIXAS DE ÁUDIO DISPONÍVEIS
  // 🎙️ INICIAR GRAVAÇÃO MISTURANDO APENAS AS FAIXAS DE ÁUDIO REAIS
 // 🎙️ INICIAR GRAVAÇÃO UTILIZANDO WEB AUDIO API (MIXAGEM REAL DE HARDWARE)
  useEffect(() => {
    if (localStream && !mediaRecorderRef.current) {
      try {
        // 1. Inicializa o contexto de áudio do navegador
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContextClass()
        
        // 2. Cria o nó de destino (onde vamos capturar o som unificado)
        const dest = audioContext.createMediaStreamDestination()
        let hasTracks = false

        // 3. Injeta o áudio local (Microfone) no misturador
        if (localStream.getAudioTracks().length > 0) {
          const localSource = audioContext.createMediaStreamSource(localStream)
          localSource.connect(dest)
          hasTracks = true
        }

        // 4. Injeta o áudio de todos os participantes remotos ativos no misturador
        participants.forEach(p => {
          if (p.stream && p.stream.getAudioTracks().length > 0) {
            try {
              const remoteSource = audioContext.createMediaStreamSource(p.stream)
              remoteSource.connect(dest)
              hasTracks = true
            } catch (e) {
              console.warn(`Não foi possível acoplar áudio do participante ${p.name}:`, e)
            }
          }
        })

        // Se nenhuma faixa de áudio real pôde ser acoplada, aborta para não gerar arquivo vazio
        if (!hasTracks) return

        // 5. O MediaRecorder grava a stream unificada e perfeitamente sincronizada pelo browser
        const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus' })
        audioChunksRef.current = []

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        recorder.onstop = async () => {
          // Fecha o contexto de áudio para libertar os recursos de hardware do PC
          audioContext.close()
          await uploadMeetingAudio()
        }

        recorder.start(1000) // Grava em blocos de 1 segundo
        mediaRecorderRef.current = recorder
        mixStreamRef.current = dest.stream
        
        console.log("✅ [Web Audio API] Misturador de canais ativo. Gravação sincronizada iniciada.")
      } catch (err) {
        console.error("Erro ao inicializar o misturador de áudio:", err)
      }
    }
  }, [localStream, participants])

  // 📤 ENVIO DO FICHEIRO CORRIGIDO PARA O BACKEND
  const uploadMeetingAudio = async () => {
    // Garante que o blob final mantém explicitamente o tipo do codec correto
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
    
    // 🔥 Proteção fundamental: se a reunião durou milissegundos ou o arquivo for minúsculo, aborta
    if (audioBlob.size < 4000) {
      console.warn("⚠️ Gravação muito curta ou sem dados suficientes. Abortando upload.")
      return 
    }

    const today = new Date()
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const formData = new FormData()
    // Forçamos a extensão .webm explicitamente
    formData.append('audio', audioBlob, 'reuniao.webm')
    formData.append('roomId', 'geral')
    formData.append('date', formattedDate)

    try {
      console.log("📤 Enviando áudio estruturado para o backend...")
      await api.post('/calls/process-audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log("✅ Áudio processado e transcrito com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao enviar áudio final:", error)
    }
  }

  const handleFinalizeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (mixStreamRef.current) {
      mixStreamRef.current.getTracks().forEach(track => track.stop())
    }
  }

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
    console.log("🛑 Encerrando chamada e processando gravação...")
    
    // 1. Para o gravador (isto dispara o recorder.onstop e consequentemente o uploadMeetingAudio)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (mixStreamRef.current) {
      mixStreamRef.current.getTracks().forEach(track => track.stop())
    }

    // 2. Executa a limpeza do WebRTC
    endCall()

    // 3. Dá um pequeno delay de 500ms para o Axios iniciar o upload antes de desparar a navegação de ecrã
    setTimeout(() => {
      navigate(-1)
    }, 500)
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

      {/* Conteúdo Principal */}
      <div className="flex-1 flex min-h-0 relative">
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

        {/* Lista Nominal Lateral */}
        <div className="w-64 bg-gray-900/40 backdrop-blur border-l border-gray-800 flex flex-col p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Users size={14} /> Participantes ({streamsList.length})
          </h3>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {streamsList.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900/80 border border-gray-800/60">
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

      {/* Painel Inferior de Controles */}
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
      <video ref={videoRef} autoPlay playsInline muted={participant.isLocal} className="w-full h-full object-cover rounded-xl" />
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md text-xs font-medium border border-gray-800 z-10">
        {participant.name}
      </div>
    </div>
  )
}