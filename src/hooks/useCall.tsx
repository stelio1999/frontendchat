import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../services/socket'
import api from '../services/api'
import toast from 'react-hot-toast'
import webrtcService from '../services/webrtc.service'

export const useCall = () => {
  const [isInCall, setIsInCall] = useState(false)
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const navigate = useNavigate()

  // Setup socket listeners
  useEffect(() => {
    console.log('Setting up call event listeners...')
    
    const handleIncomingCall = (data: any) => {
      console.log('🔔 INCOMING CALL RECEIVED:', data)
      setIncomingCall(data)
      
      // Show toast notification
      toast.custom((t) => (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 animate-slide-in-up">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-whatsapp-green p-4 text-white">
              <p className="text-sm font-medium">Chamada recebida</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center text-white text-xl">
                  {data.type === 'video' ? '📹' : '📞'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{data.callerName}</h3>
                  <p className="text-sm text-gray-500">
                    Chamada de {data.type === 'video' ? 'vídeo' : 'voz'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => acceptCall(data.callId, data)}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                >
                  📞 Atender
                </button>
                <button
                  onClick={() => rejectCall(data.callId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                >
                  ✕ Recusar
                </button>
              </div>
            </div>
          </div>
        </div>
      ), { duration: 30000, id: `call-${data.callId}` })
    }

    const handleCallAccepted = (data: any) => {
      console.log('✅ CALL ACCEPTED:', data)
      toast.success('Chamada conectada!')
    }

    const handleCallRejected = (data: any) => {
      console.log('❌ CALL REJECTED:', data)
      toast.error('Chamada recusada')
      setIncomingCall(null)
    }

    const handleCallEnded = (data: any) => {
      console.log('🔚 CALL ENDED:', data)
      toast.info('Chamada encerrada')
      setIsInCall(false)
      setCurrentCallId(null)
      webrtcService.endCall()
      navigate(-1)
    }

    const handleCallSignal = async ({ signal, callerId }: any) => {
      console.log('📡 CALL SIGNAL received from:', callerId)
      webrtcService.handleSignal(callerId, signal)
    }

    // Register all event listeners
    socket.on('incoming_call', handleIncomingCall)
    socket.on('call_accepted', handleCallAccepted)
    socket.on('call_rejected', handleCallRejected)
    socket.on('call_ended', handleCallEnded)
    socket.on('call_signal', handleCallSignal)

    return () => {
      socket.off('incoming_call', handleIncomingCall)
      socket.off('call_accepted', handleCallAccepted)
      socket.off('call_rejected', handleCallRejected)
      socket.off('call_ended', handleCallEnded)
      socket.off('call_signal', handleCallSignal)
    }
  }, [navigate])

  const startCall = async (chatId: string, type: 'voice' | 'video', receiverId: string) => {
  try {
    console.log('Starting call:', { chatId, type, receiverId })
    
    // Set type immediately for UI
    setCallType(type)
    
    const response = await api.post('/calls/start', {
      chatId,
      type,
      receiverId,
    })
    
    const call = response.data
    console.log('Call created:', call)
    
    setCurrentCallId(call.id)
    
    // Setup WebRTC
    await webrtcService.startCall(
      {
        callerId: call.caller_id,
        receiverId: receiverId,
        callId: call.id,
        chatId: chatId,
        type: type,
      },
      (signal) => {
        socket.emit('call_signal', {
          callId: call.id,
          signal,
          receiverId: receiverId,
        })
      }
    )
    
    // Navigate with type in URL
    navigate(`/call/${call.id}?type=${type}`)
    
  } catch (error: any) {
    console.error('Error starting call:', error)
    toast.error(error.response?.data?.error || 'Não foi possível iniciar a chamada')
    setCallType(null)
  }
}

 const acceptCall = async (callId: string, callData?: any) => {
  console.log('✅ Accepting call:', callId)
  console.log('Call data received:', callData)
  
  let callInfo = callData
  if (!callInfo) {
    callInfo = incomingCall
    console.log('Using incomingCall from state:', callInfo)
  }
  
  if (!callInfo) {
    console.error('No call data available to accept call')
    toast.error('Erro ao aceitar chamada: dados não disponíveis')
    return
  }
  
  if (!callInfo.type) {
    console.error('Call data missing type property:', callInfo)
    toast.error('Erro ao aceitar chamada: tipo não especificado')
    return
  }
  
  // Set the call type before navigating
  setCallType(callInfo.type)
  setCurrentCallId(callId)
  setIsInCall(true)
  
  console.log('Setting call type to:', callInfo.type)
  
  try {
    // Accept call on backend
    await api.post(`/calls/${callId}/accept`)
    
    // Setup WebRTC to answer
    await webrtcService.answerCall(
      {
        callerId: callInfo.callerId,
        receiverId: callInfo.receiverId || (window as any).currentUserId,
        callId: callId,
        chatId: callInfo.chatId,
        type: callInfo.type,
      },
      (signal) => {
        socket.emit('call_signal', {
          callId: callId,
          signal,
          receiverId: callInfo.callerId,
        })
      }
    )
    
    // Navigate to call view with type in URL
    navigate(`/call/${callId}?type=${callInfo.type}`)
    
    toast.dismiss(`call-${callId}`)
    setIncomingCall(null)
    
  } catch (error) {
    console.error('Error accepting call:', error)
    toast.error('Não foi possível aceitar a chamada')
    setCallType(null)
    setIsInCall(false)
  }
}

  const rejectCall = async (callId: string) => {
    console.log('❌ Rejecting call:', callId)
    
    try {
      await api.post(`/calls/${callId}/reject`)
      socket.emit('call_rejected', { callId })
      toast.dismiss(`call-${callId}`)
      toast.success('Chamada recusada')
      setIncomingCall(null)
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
  }

  const endCall = async () => {
    if (currentCallId) {
      try {
        await api.post(`/calls/${currentCallId}/end`, {
          duration: 0,
        })
      } catch (error) {
        console.error('Error ending call:', error)
      }
    }
    
    webrtcService.endCall()
    setIsInCall(false)
    setCurrentCallId(null)
  }

  const toggleMute = () => {
    const isMuted = webrtcService.toggleMicrophone()
    return isMuted
  }

  const toggleVideo = () => {
    const isVideoOn = webrtcService.toggleCamera()
    return isVideoOn
  }

  const shareScreen = async () => {
    await webrtcService.shareScreen()
  }

  const getLocalStream = () => webrtcService.getLocalStream()
  const getRemoteStream = () => webrtcService.getRemoteStream('')

  return {
    isInCall,
    callType,
    incomingCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    shareScreen,
    getLocalStream,
    getRemoteStream,
  }
}