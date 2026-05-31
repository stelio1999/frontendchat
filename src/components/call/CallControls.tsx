import React from 'react'
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Volume2, VolumeX, Share2, Monitor, 
  MessageCircle, Users
} from 'lucide-react'

interface CallControlsProps {
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onEndCall: () => void
  onToggleSpeaker?: () => void
  onToggleChat?: () => void
  onToggleParticipants?: () => void
}

export default function CallControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onEndCall,
  onToggleSpeaker,
  onToggleChat,
  onToggleParticipants,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onToggleMute}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all
          ${isMuted 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-white/20 hover:bg-white/30 backdrop-blur'
          }
        `}
      >
        {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
      </button>
      
      <button
        onClick={onToggleVideo}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all
          ${isVideoOff 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-white/20 hover:bg-white/30 backdrop-blur'
          }
        `}
      >
        {isVideoOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
      </button>
      
      <button
        onClick={onToggleScreenShare}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all
          ${isScreenSharing 
            ? 'bg-whatsapp-green hover:bg-whatsapp-dark' 
            : 'bg-white/20 hover:bg-white/30 backdrop-blur'
          }
        `}
      >
        <Monitor size={20} className="text-white" />
      </button>
      
      {onToggleSpeaker && (
        <button
          onClick={onToggleSpeaker}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all"
        >
          <Volume2 size={20} className="text-white" />
        </button>
      )}
      
      {onToggleChat && (
        <button
          onClick={onToggleChat}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all"
        >
          <MessageCircle size={20} className="text-white" />
        </button>
      )}
      
      {onToggleParticipants && (
        <button
          onClick={onToggleParticipants}
          className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center transition-all"
        >
          <Users size={20} className="text-white" />
        </button>
      )}
      
      <button
        onClick={onEndCall}
        className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg"
      >
        <PhoneOff size={20} className="text-white" />
      </button>
    </div>
  )
}