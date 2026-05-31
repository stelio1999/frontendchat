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

  const startCall = useCallback(async () => {
    // 🔥 IMPEDIMENTO: Se já chamou uma vez, cancela a segunda execução concorrente do StrictMode
    if (isCallingRef.current) return
    isCallingRef.current = true

    try {
      const stream = await initLocalStream()
      if (!stream) {
        isCallingRef.current = false
        return
      }

      // Limpa listeners antigos para evitar duplicações de eventos na mesma instância de socket
      socket.off('user_joined')
      socket.off('call_signal')
      socket.off('user_left')

      socket.emit('join_call', { callId: roomId, userId: user?.id, userName: user?.name })

      socket.on('user_joined', ({ userId, userName }) => {
        console.log(`👤 Usuário entrou na sala: ${userName} (${userId})`)
        
        if (peersRef.current.has(userId)) return

        const peer = createPeer(userId, stream)
        peersRef.current.set(userId, peer)

        peer.on('stream', (remoteStream) => {
          setParticipants(prev => {
            if (prev.some(p => p.id === userId)) return prev
            return [...prev, { id: userId, name: userName || 'Participante', stream: remoteStream, isLocal: false }]
          })
        })
      })

      socket.on('call_signal', ({ signal, senderId, senderName, targetId }) => {
        if (targetId !== user?.id) return

        const peer = peersRef.current.get(senderId)
        
        if (peer) {
          peer.signal(signal)
        } else {
          const newPeer = addPeer(signal, senderId, stream)
          peersRef.current.set(senderId, newPeer)

          newPeer.on('stream', (remoteStream) => {
            setParticipants(prev => {
              if (prev.some(p => p.id === senderId)) return prev
              return [...prev, { id: senderId, name: senderName || 'Participante', stream: remoteStream, isLocal: false }]
            })
          })
        }
      })

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
  }, [roomId, user, initLocalStream, createPeer, addPeer])

  const endCall = useCallback(() => {
    socket.emit('leave_call', roomId) 
    
    peersRef.current.forEach(peer => peer.destroy())
    peersRef.current.clear()

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }

    setLocalStream(null)
    setParticipants([])
    isCallingRef.current = false
    isInitialisedRef.current = false
    
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

  return {
    localStream,
    participants,
    startCall,
    endCall,
  }
}