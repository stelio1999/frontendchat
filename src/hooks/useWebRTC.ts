import { useEffect, useRef, useState, useCallback } from 'react'
import Peer from 'simple-peer'
import socket from '../services/socket'
import { useAuthStore } from '../stores/authStore'

export const useWebRTC = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [peers, setPeers] = useState<Map<string, Peer.Instance>>(new Map())
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const { user } = useAuthStore()
  
  const peerRef = useRef<Peer.Instance | null>(null)

  const initLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const constraints = { video, audio }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }, [])

  const startCall = useCallback(async () => {
    const stream = await initLocalStream(true, true)
    
    peerRef.current = new Peer({
      initiator: true,
      stream,
      trickle: false,
    })

    peerRef.current.on('signal', (signal) => {
      socket.emit('call_signal', { signal, roomId, callerId: user?.id })
    })

    peerRef.current.on('stream', (stream) => {
      setRemoteStream(stream)
    })

    socket.on('call_signal', ({ signal, callerId }) => {
      if (!peerRef.current) {
        peerRef.current = new Peer({
          initiator: false,
          stream,
          trickle: false,
        })

        peerRef.current.on('signal', (signal) => {
          socket.emit('call_signal', { signal, roomId, callerId: user?.id })
        })

        peerRef.current.on('stream', (stream) => {
          setRemoteStream(stream)
        })

        peerRef.current.signal(signal)
      } else {
        peerRef.current.signal(signal)
      }
    })
  }, [roomId, user, initLocalStream])

  const endCall = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
      setLocalStream(null)
    }
    setRemoteStream(null)
    socket.emit('end_call', { roomId })
  }, [localStream, roomId])

  const toggleScreenShare = useCallback(async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const videoTrack = screenStream.getVideoTracks()[0]
        const sender = peerRef.current?._pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
        videoTrack.onended = () => {
          if (localStream) {
            const originalVideoTrack = localStream.getVideoTracks()[0]
            sender?.replaceTrack(originalVideoTrack)
          }
          setIsScreenSharing(false)
        }
        setIsScreenSharing(true)
      } catch (error) {
        console.error('Error sharing screen:', error)
      }
    } else {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0]
        const sender = peerRef.current?._pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      }
      setIsScreenSharing(false)
    }
  }, [isScreenSharing, localStream])

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      audioTrack.enabled = !audioTrack.enabled
    }
  }, [localStream])

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      videoTrack.enabled = !videoTrack.enabled
    }
  }, [localStream])

  useEffect(() => {
    socket.on('user_left', () => {
      endCall()
    })

    return () => {
      endCall()
      socket.off('call_signal')
      socket.off('user_left')
    }
  }, [endCall])

  return {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleScreenShare,
    toggleAudio,
    toggleVideo,
    isScreenSharing,
  }
}