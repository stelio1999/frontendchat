import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../../services/socket'
import toast from 'react-hot-toast'
import api from '../../services/api'
import webrtcService from '../../services/webrtc.service'

interface CallListenerProps {
  currentUserId: string
}

export default function CallListener({ currentUserId }: CallListenerProps) {
  const navigate = useNavigate()
  const pendingCallRef = useRef<any>(null)
  const activeToastIdRef = useRef<string | null>(null)

  useEffect(() => {
    console.log('🎧 CallListener mounted for user:', currentUserId)
    console.log('Socket connected status:', socket.isConnected())

    const handleIncomingCall = async (data: any) => {
      console.log('🔔🔔🔔 INCOMING CALL RECEIVED! 🔔🔔🔔')
      console.log('Full call data:', data)
      
      // Store call data
      pendingCallRef.current = data

      // Dismiss any existing toast
      if (activeToastIdRef.current) {
        toast.dismiss(activeToastIdRef.current)
      }

      // Create custom toast that stays until action is taken
      const toastId = toast.custom(
        (t) => (
          <div 
            className={`fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 z-50 transition-all duration-300 ${
              t.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="bg-whatsapp-green p-4 text-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Chamada recebida</p>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-whatsapp-green rounded-full flex items-center justify-center text-white text-xl">
                    {data.type === 'video' ? '📹' : '📞'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {data.callerName || 'Desconhecido'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Chamada de {data.type === 'video' ? 'vídeo' : 'voz'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      toast.dismiss(toastId)
                      acceptCall(data.callId, data)
                    }}
                    className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                  >
                    <span>📞</span>
                    Atender
                  </button>
                  <button
                    onClick={() => {
                      toast.dismiss(toastId)
                      rejectCall(data.callId)
                    }}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                  >
                    <span>✕</span>
                    Recusar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          id: `call-${data.callId}`,
          duration: Infinity, // Never auto-dismiss
          position: 'bottom-center',
        }
      )
      
      activeToastIdRef.current = toastId

      // Also show browser notification
      if (Notification.permission === 'granted') {
        new Notification(`Chamada de ${data.callerName}`, {
          body: `Chamada de ${data.type === 'video' ? 'vídeo' : 'voz'} recebida`,
          icon: '/favicon.ico',
          requireInteraction: true, // Keeps notification visible until clicked
        })
      }

      // Play ringtone
      playRingtone()
    }

    const playRingtone = () => {
      try {
        // Create audio context for ringtone
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 440 // A4 note
        gainNode.gain.value = 0.3
        
        oscillator.start()
        
        // Stop after 2 seconds
        setTimeout(() => {
          oscillator.stop()
          audioContext.close()
        }, 2000)
      } catch (error) {
        console.error('Error playing ringtone:', error)
      }
    }

    const acceptCall = async (callId: string, callData: any) => {
  console.log('✅ Accepting call from CallListener:', callId)
  console.log('Call data:', callData)
  
  if (!callData || !callData.type) {
    console.error('Invalid call data:', callData)
    toast.error('Erro ao aceitar chamada')
    return
  }
  
  try {
    // Accept call on backend
    await api.post(`/calls/${callId}/accept`)
    
    const currentUserId = localStorage.getItem('userId') || ''
    
    // Setup WebRTC to answer
    await webrtcService.answerCall(
      {
        callerId: callData.callerId,
        receiverId: currentUserId,
        callId: callId,
        chatId: callData.chatId,
        type: callData.type,
      },
      (signal) => {
        socket.emit('call_signal', {
          callId: callId,
          signal,
          receiverId: callData.callerId,
        })
      }
    )
    
    // Navigate to call view with type in URL
    navigate(`/call/${callId}?type=${callData.type}`)
    
    toast.dismiss(`call-${callId}`)
    pendingCallRef.current = null
    
  } catch (error) {
    console.error('Error accepting call:', error)
    toast.error('Não foi possível aceitar a chamada')
  }
}

    const rejectCall = async (callId: string) => {
      console.log('❌ Rejecting call:', callId)
      
      try {
        await api.post(`/calls/${callId}/reject`)
        socket.emit('call_rejected', { callId })
        toast.success('Chamada recusada')
        pendingCallRef.current = null
        activeToastIdRef.current = null
      } catch (error) {
        console.error('Error rejecting call:', error)
      }
    }

    // Register event listener
    console.log('Registering incoming_call event listener...')
    socket.on('incoming_call', handleIncomingCall)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      console.log('Cleaning up CallListener...')
      socket.off('incoming_call', handleIncomingCall)
      if (activeToastIdRef.current) {
        toast.dismiss(activeToastIdRef.current)
      }
    }
  }, [currentUserId, navigate])

  return null
}