import { useState, useEffect } from 'react'
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
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null) // ◀️ Estado reativo real
  const navigate = useNavigate()

  useEffect(() => {
    // ◀️ Escuta o evento de stream vindo do WebRTCService
    const handleRemoteStream = (data: { userId: string, stream: MediaStream }) => {
      console.log('⚡ Hook useCall capturou stream remoto:', data.stream.id)
      setRemoteStream(data.stream)
    }

    webrtcService.on('remote_stream', handleRemoteStream)
    
    // Cleanup do listener do serviço
    return () => {
      webrtcService.off('remote_stream', handleRemoteStream)
    }
  }, [])

  useEffect(() => {
    console.log('Setting up call event listeners...')
    
    const handleIncomingCall = (data: any) => {
      console.log('🔔 INCOMING CALL RECEIVED:', data)
      setIncomingCall(data)
      
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
      setIsInCall(true)
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
      setRemoteStream(null)
      webrtcService.endCall()
      navigate(-1)
    }

    const handleCallSignal = async ({ signal, callerId, senderId, from }: any) => {
      const originUser = callerId || senderId || from;
      console.log('📡 CALL SIGNAL recebido do ID:', originUser)
      if (originUser) {
        webrtcService.handleSignal(originUser, signal)
      }
    }

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
  }, [navigate, incomingCall])

  const startCall = async (chatId: string, type: 'voice' | 'video', receiverId: string) => {
    try {
      setCallType(type)
      const response = await api.post('/calls/start', { chatId, type, receiverId })
      const call = response.data
      setCurrentCallId(call.id)
      setIsInCall(true)
      
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
      navigate(`/call/${call.id}?type=${type}`)
    } catch (error: any) {
      console.error('❌ Error starting call:', error)
      toast.error('Não foi possível iniciar a chamada')
      setCallType(null)
    }
  }

  const acceptCall = async (callId: string, callData?: any) => {
    let callInfo = callData || incomingCall
    if (!callInfo) return

    setCallType(callInfo.type)
    setCurrentCallId(callId)
    setIsInCall(true)
    
    try {
      await api.post(`/calls/${callId}/accept`)
      
      const targetUserId = callInfo.callerId || callInfo.caller_id;

      await webrtcService.answerCall(
        {
          callerId: targetUserId,
          receiverId: callInfo.receiverId || (window as any).currentUserId || '',
          callId: callId,
          chatId: callInfo.chatId,
          type: callInfo.type,
        },
        (signal) => {
          socket.emit('call_signal', {
            callId: callId,
            signal,
            receiverId: targetUserId,
          })
        }
      )
      
      navigate(`/call/${callId}?type=${callInfo.type}`)
      toast.dismiss(`call-${callId}`)
      setIncomingCall(null)
    } catch (error) {
      console.error('Error accepting call:', error)
      setCallType(null)
      setIsInCall(false)
    }
  }

  const rejectCall = async (callId: string) => {
    try {
      await api.post(`/calls/${callId}/reject`)
      socket.emit('call_rejected', { callId })
      toast.dismiss(`call-${callId}`)
      setIncomingCall(null)
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
  }

  const endCall = async () => {
    if (currentCallId) {
      try {
        await api.post(`/calls/${currentCallId}/end`, { duration: 0 })
      } catch (error) { console.error(error) }
    }
    webrtcService.endCall()
    setRemoteStream(null)
    setIsInCall(false)
    setCurrentCallId(null)
  }

  return {
    isInCall,
    callType,
    incomingCall,
    remoteStream, // ◀️ Exposto diretamente para a View saber quando renderizar
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute: () => webrtcService.toggleMicrophone(),
    toggleVideo: () => webrtcService.toggleCamera(),
    shareScreen: () => webrtcService.shareScreen(),
    getLocalStream: () => webrtcService.getLocalStream(),
  }
}