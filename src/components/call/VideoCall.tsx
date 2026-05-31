import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Volume2, VolumeX, Share2, Monitor, Users 
} from 'lucide-react'
import { useWebRTC } from '../../hooks/useWebRTC'
import CallControls from './CallControls'
import ScreenShare from './ScreenShare'

export default function VideoCall() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  
  const { localStream, remoteStream, startCall, endCall, toggleScreenShare } = useWebRTC(chatId!)

  useEffect(() => {
    startCall()
    return () => endCall()
  }, [])

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [localStream, remoteStream])

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      audioTrack.enabled = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      videoTrack.enabled = !isVideoOff
      setIsVideoOff(!isVideoOff)
    }
  }

  const handleScreenShare = async () => {
    await toggleScreenShare()
    setIsScreenSharing(!isScreenSharing)
  }

  const handleEndCall = () => {
    endCall()
    navigate(-1)
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Container */}
      <div className="relative h-full">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video PiP */}
        <div className="absolute top-4 right-4 w-48 h-64 rounded-lg overflow-hidden shadow-lg border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Screen Share */}
        {isScreenSharing && <ScreenShare stream={localStream} />}
        
        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0">
          <CallControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={handleScreenShare}
            onEndCall={handleEndCall}
          />
        </div>
        
        {/* Participants */}
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Users size={16} className="text-white" />
          <span className="text-white text-sm">{participants.length} participantes</span>
        </div>
      </div>
    </div>
  )
}