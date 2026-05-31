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
  
  // Get call type from URL params
  const urlCallType = searchParams.get('type') as 'voice' | 'video' | null
  
  const {
    callType: hookCallType,
    isInCall,
    isMuted,
    isVideoOff,
    endCall,
    toggleMute,
    toggleVideo,
    shareScreen,
    getLocalStream,
    getRemoteStream,
  } = useCall()

  // Use URL type first, then hook type
  const callType = urlCallType || hookCallType || 'voice'
  
  const [duration, setDuration] = useState(0)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [localStreamSet, setLocalStreamSet] = useState(false)
  const [remoteStreamSet, setRemoteStreamSet] = useState(false)

  console.log('CallView rendering with callType:', callType)
  console.log('URL call type:', urlCallType)
  console.log('Hook call type:', hookCallType)

  useEffect(() => {
    console.log('CallView mounted, callId:', callId, 'callType:', callType)
    
    // Setup local video stream
    const setupLocalStream = async () => {
      const stream = getLocalStream()
      if (stream && localVideoRef.current && !localStreamSet) {
        console.log('Setting local stream to video element')
        localVideoRef.current.srcObject = stream
        localVideoRef.current.muted = true
        
        try {
          await localVideoRef.current.play()
          setLocalStreamSet(true)
        } catch (err) {
          console.error('Error playing local video:', err)
        }
      }
    }

    // Setup remote stream
    const setupRemoteStream = () => {
      const stream = getRemoteStream()
      if (stream && remoteVideoRef.current && !remoteStreamSet) {
        console.log('Setting remote stream to video element')
        console.log('Remote stream tracks:', stream.getTracks().map(t => `${t.kind} (${t.enabled})`))
        
        stream.getAudioTracks().forEach(track => {
          track.enabled = true
        })
        
        remoteVideoRef.current.srcObject = stream
        setRemoteStreamSet(true)
        
        remoteVideoRef.current.play().catch(err => {
          console.error('Error playing remote video:', err)
        })
      }
    }

    // Check streams periodically
    const interval = setInterval(() => {
      setupLocalStream()
      setupRemoteStream()
    }, 500)

    // Start timer
    const timer = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(timer)
    }
  }, [callType, getLocalStream, getRemoteStream, localStreamSet, remoteStreamSet, callId])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEndCall = () => {
    endCall()
    navigate(-1)
  }

  const handleToggleSpeaker = () => {
    if (remoteVideoRef.current) {
      // @ts-ignore
      remoteVideoRef.current.muted = !isSpeakerOn
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  // Video Call UI
  if (callType === 'video') {
    console.log('Rendering VIDEO call UI')
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Remote Video (full screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (PiP) */}
        <div className="absolute top-4 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Call Info */}
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1.5">
          <p className="text-white text-sm font-mono">{formatDuration(duration)}</p>
          <p className="text-white/70 text-xs">Chamada de vídeo</p>
        </div>
        
        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isVideoOff ? <VideoOff size={24} className="text-white" /> : <Video size={24} className="text-white" />}
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
  console.log('Rendering VOICE call UI')
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-whatsapp-dark to-whatsapp-green z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Avatar */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <PhoneOff size={64} className="text-white" />
          </div>
        </div>
        
        {/* Call Status */}
        <h2 className="text-2xl font-bold text-white mb-2">Chamada de voz</h2>
        <p className="text-white/70 text-lg mb-12 font-mono">{formatDuration(duration)}</p>
        
        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMuted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
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