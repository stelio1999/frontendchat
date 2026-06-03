import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'simple-peer'
import socket from '../services/socket'
import { useAuthStore } from '../stores/authStore'

interface Participant {
  id: string
  name: string
  stream: MediaStream
  isLocal: boolean
}

export const useWebRTC = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const { user } = useAuthStore()

  const peersRef = useRef<Map<string, Peer.Instance>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const isInitialisedRef = useRef<boolean>(false)
  const isCallingRef = useRef<boolean>(false) // 🔥 Bloqueia execuções simultâneas do startCall


const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const combinedStreamRef = useRef<MediaStream | null>(null)

  const initLocalStream = useCallback(async () => {
  if (localStreamRef.current) {
    return localStreamRef.current
  }

  // Se já está a inicializar, devolve uma promessa que espera o stream estar pronto
  if (isInitialisedRef.current) {
    console.log("⚠️ Inicialização de média já está em curso, aguardando...")
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      if (localStreamRef.current) return localStreamRef.current
    }
  }

  // Bloqueio imediato antes do await para evitar condições de corrida assíncronas
  isInitialisedRef.current = true

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    
    localStreamRef.current = stream
    setLocalStream(stream)
    
    setParticipants(prev => {
      if (prev.some(p => p.isLocal)) return prev
      return [{ id: user?.id || 'local', name: user?.name || 'Eu', stream, isLocal: true }]
    })

    return stream
  } catch (error) {
    console.error("Erro ao aceder aos dispositivos de média:", error)
    isInitialisedRef.current = false // Liberta o estado para nova tentativa
    throw error
  }
}, [user])

  const createPeer = useCallback((userToSignal: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    })

    peer.on('signal', (signal) => {
      socket.emit('call_signal', {
        signal,
        roomId,
        targetId: userToSignal,
        senderId: user?.id,
        senderName: user?.name
      })
    })

    return peer
  }, [roomId, user])

  const addPeer = useCallback((incomingSignal: Peer.SignalData, callerId: string, stream: MediaStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    })

    peer.on('signal', (signal) => {
      socket.emit('call_signal', {
        signal,
        roomId,
        targetId: callerId,
        senderId: user?.id,
        senderName: user?.name
      })
    })

    peer.signal(incomingSignal)
    return peer
  }, [roomId, user])

// Função auxiliar interna para isolar a atualização de participantes remotos e evitar código duplicado
  const handleRemoteStream = useCallback((remoteUserId: string, remoteUserName: string, remoteStream: MediaStream) => {
    setParticipants(prev => {
      if (prev.some(p => p.id === remoteUserId)) return prev
      return [...prev, { 
        id: remoteUserId, 
        name: remoteUserName || 'Participante', 
        stream: remoteStream, 
        isLocal: false 
      }]
    })
  }, [])

  const startCall = useCallback(async () => {
    if (isCallingRef.current) return
    isCallingRef.current = true

    try {
      const stream = await initLocalStream()
      if (!stream) {
        isCallingRef.current = false
        return
      }

      // 1. Limpar rigorosamente usando os métodos do teu SocketService
      socket.off('user_joined')
      socket.off('call_signal')
      socket.off('user_left')
      socket.off('room_users')

      // 2. Emitir entrada na sala de reunião
      socket.emit('join_call', { callId: roomId, userId: user?.id, userName: user?.name })

      // 3. Ouvir quem JÁ ESTAVA na sala (Eu tomo a iniciativa de ligar para eles)
      socket.on('room_users', (usersInRoom: { userId: string, userName: string }[]) => {
        console.log("👥 Utilizadores já presentes na sala:", usersInRoom)
        
        usersInRoom.forEach(({ userId, userName }) => {
          if (userId === user?.id || peersRef.current.has(userId)) return

          console.log(`🚀 A iniciar conexão ativa com veterano: ${userName}`)
          const peer = createPeer(userId, stream)
          peersRef.current.set(userId, peer)

          peer.on('stream', (remoteStream) => handleRemoteStream(userId, userName, remoteStream))
        })
      })

      // 4. Ouvir quem entra DEPOIS de mim (Novatos)
      socket.on('user_joined', ({ userId, userName }) => {
        console.log(`👤 Novo usuário entrou na sala: ${userName} (${userId})`)
        if (userId === user?.id || peersRef.current.has(userId)) return

        // Aguardamos que o novato monte o peer dele (initiator: true) ao ler o 'room_users' no lado dele
        console.log(`⏳ A aguardar sinal de oferta SDP do novato: ${userName}`)
      })

      // 5. Orquestração de Sinais SDP / ICE Candidates
      socket.on('call_signal', ({ signal, senderId, senderName, targetId }) => {
        if (targetId !== user?.id) return
        console.log(`📡 Sinal recebido de: ${senderName} (Tipo: ${signal.type || 'Candidate'})`)

        const peer = peersRef.current.get(senderId)
        
        if (peer) {
          peer.signal(signal)
        } else {
          // Se o peer não existe, fomos interpelados por uma oferta de um novato. Agimos como respondentes.
          console.log(`➕ A criar peer passivo (respondente) para: ${senderName}`)
          const newPeer = addPeer(signal, senderId, stream)
          peersRef.current.set(senderId, newPeer)

          newPeer.on('stream', (remoteStream) => handleRemoteStream(senderId, senderName, remoteStream))
        }
      })

      // 6. Tratar saídas abruptas ou normais da sala
      socket.on('user_left', ({ userId }) => {
        console.log(`❌ Usuário saiu: ${userId}`)
        const peer = peersRef.current.get(userId)
        if (peer) {
          peer.destroy()
          peersRef.current.delete(userId)
        }
        setParticipants(prev => prev.filter(p => p.id !== userId))
      })

    } catch (err) {
      isCallingRef.current = false
      console.error("Falha ao iniciar a chamada WebRTC:", err)
    }
  }, [roomId, user, initLocalStream, createPeer, addPeer, handleRemoteStream])

  const endCall = useCallback(() => {
    // 1. Avisar o backend que estamos a abandonar o barco
    socket.emit('leave_call', roomId) 
    
    // 2. Destruir e limpar todas as conexões peer ativas de forma limpa
    peersRef.current.forEach(peer => peer.destroy())
    peersRef.current.clear()

    // 3. Desligar a câmara e microfone locais cortando as tracks de hardware
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    // 4. Resetar estados reativos
    setLocalStream(null)
    setParticipants([])
    isCallingRef.current = false
    isInitialisedRef.current = false
    
    // 5. Desvincular listeners do SocketService para evitar processamento em background residual
    socket.off('room_users')
    socket.off('user_joined')
    socket.off('call_signal')
    socket.off('user_left')
  }, [roomId])
  // Limpeza robusta ao desmontar o hook
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
        localStreamRef.current = null
      }
      peersRef.current.forEach(peer => peer.destroy())
      peersRef.current.clear()
      isCallingRef.current = false
      isInitialisedRef.current = false

      socket.off('user_joined')
      socket.off('call_signal')
      socket.off('user_left')
    }
  }, [])


const startRecording = useCallback(async () => {
    try {
      // 1. Captura o áudio do sistema (Aba/Ecrã) - O utilizador deve marcar "Partilhar áudio"
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Necessário para getDisplayMedia, podemos ignorar o vídeo depois
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      // 2. Captura o microfone local (se já não estiver ativo no localStreamRef)
      const micStream = localStreamRef.current || await navigator.mediaDevices.getUserMedia({ audio: true })

      // 3. Misturar as tracks de áudio num único Stream
      const audioContext = new AudioContext()
      const dest = audioContext.createMediaStreamDestination()

      // Origem 1: Áudio do Sistema (Outros participantes)
      if (screenStream.getAudioTracks().length > 0) {
        const source1 = audioContext.createMediaStreamSource(screenStream)
        source1.connect(dest)
      }

      // Origem 2: Teu Microfone
      if (micStream.getAudioTracks().length > 0) {
        const source2 = audioContext.createMediaStreamSource(micStream)
        source2.connect(dest)
      }

      combinedStreamRef.current = dest.stream
      audioChunksRef.current = []

      // 4. Iniciar o Gravador
      const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Parar todas as tracks do ecrã para fechar o modal de partilha
        screenStream.getTracks().forEach(track => track.stop())

        // Enviar o ficheiro de áudio para o backend processar com o Gemini
        await sendAudioToBackend(audioBlob)
      }

      recorder.start(1000) // Grava em blocos a cada 1 segundo
      setIsRecording(true)
      console.log("🎤 Gravação de áudio interno iniciada...")
    } catch (err) {
      console.error("Erro ao iniciar captura interna de áudio:", err)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      console.log("🛑 Gravação de áudio interrompida.")
    }
  }, [isRecording])

  const sendAudioToBackend = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('audio', blob, 'reuniao.webm')
    formData.append('roomId', roomId)
    formData.append('date', new Date().toISOString().split('T')[0])

    try {
      const response = await fetch('http://localhost:3000/api/meeting/process', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      console.log("Processamento concluído. Ficheiro guardado:", data.txtPath)
    } catch (error) {
      console.error("Erro ao enviar áudio para o servidor:", error)
    }
  }

  return {
    localStream,
    participants,
    startCall,
    endCall,
    isRecording,
    startRecording,
    stopRecording
  }
}