import React, { createContext, useContext, ReactNode, useState } from 'react'
import { useWebRTC } from '../hooks/useWebRTC'

interface CallContextData {
  isInCall: boolean
  callType: 'voice' | 'video' | null
  startCall: (roomId: string, type: 'voice' | 'video') => Promise<void>
  endCall: () => void
  toggleMute: () => void
  toggleVideo: () => void
  shareScreen: () => Promise<void>
  localStream: MediaStream | null
  remoteStream: MediaStream | null
}

const CallContext = createContext<CallContextData>({} as CallContextData)

export const useCallContext = () => useContext(CallContext)

interface CallProviderProps {
  children: ReactNode
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const [isInCall, setIsInCall] = useState(false)
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null)
  const webrtc = useWebRTC('')

  const startCall = async (roomId: string, type: 'voice' | 'video') => {
    setCallType(type)
    setIsInCall(true)
    await webrtc.startCall()
  }

  const endCall = () => {
    webrtc.endCall()
    setIsInCall(false)
    setCallType(null)
  }

  return (
    <CallContext.Provider
      value={{
        isInCall,
        callType,
        startCall,
        endCall,
        toggleMute: webrtc.toggleAudio,
        toggleVideo: webrtc.toggleVideo,
        shareScreen: webrtc.toggleScreenShare,
        localStream: webrtc.localStream,
        remoteStream: webrtc.remoteStream,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}