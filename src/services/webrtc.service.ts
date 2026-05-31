import Peer from 'simple-peer'

export interface CallConfig {
  callerId: string
  receiverId: string
  callId: string
  chatId: string
  type: 'voice' | 'video'
}

class WebRTCService {
  private peers: Map<string, Peer.Instance> = new Map()
  private localStream: MediaStream | null = null
  private remoteStreams: Map<string, MediaStream> = new Map()
  private callbacks: Map<string, Set<Function>> = new Map()
  private isCallActive = false
  private currentCallId: string | null = null

  // Initialize local media stream
  async initLocalStream(type: 'voice' | 'video'): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true, // Always enable audio
        video: type === 'video',
      }
      
      console.log('Requesting media with constraints:', constraints)
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Local stream obtained:', this.localStream.getTracks().map(t => t.kind))
      return this.localStream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw new Error('Could not access camera/microphone. Please check permissions.')
    }
  }

  // Start a call (caller)
  async startCall(config: CallConfig, signalCallback: (signal: any) => void): Promise<void> {
    try {
      console.log('Starting call as CALLER:', config)
      
      // Initialize local stream
      await this.initLocalStream(config.type)
      if (!this.localStream) {
        throw new Error('Could not initialize local stream')
      }

      // Ensure audio tracks are enabled
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true
        console.log('Audio track enabled:', track.label)
      })

      // Create peer connection
      const peer = new Peer({
        initiator: true,
        stream: this.localStream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ],
        },
      })

      this.setupPeerEvents(peer, config.receiverId, signalCallback)
      this.peers.set(config.receiverId, peer)
      this.currentCallId = config.callId
      this.isCallActive = true
      
      console.log('Caller peer created successfully')
    } catch (error) {
      console.error('Error starting call:', error)
      throw error
    }
  }

  // Answer a call (receiver)
  async answerCall(config: CallConfig, signalCallback: (signal: any) => void): Promise<void> {
    try {
      console.log('Answering call as RECEIVER:', config)
      
      // Initialize local stream
      await this.initLocalStream(config.type)
      if (!this.localStream) {
        throw new Error('Could not initialize local stream')
      }

      // Ensure audio tracks are enabled
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = true
        console.log('Audio track enabled:', track.label)
      })

      // Create peer connection (non-initiator)
      const peer = new Peer({
        initiator: false,
        stream: this.localStream,
        trickle: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ],
        },
      })

      this.setupPeerEvents(peer, config.callerId, signalCallback)
      this.peers.set(config.callerId, peer)
      this.currentCallId = config.callId
      this.isCallActive = true
      
      console.log('Receiver peer created successfully')
    } catch (error) {
      console.error('Error answering call:', error)
      throw error
    }
  }

  private setupPeerEvents(peer: Peer.Instance, remoteUserId: string, signalCallback: (signal: any) => void) {
    peer.on('signal', (signal) => {
      console.log('📡 Signal generated for peer:', remoteUserId, signal.type)
      signalCallback(signal)
    })

    peer.on('stream', (stream) => {
      console.log('🎥 Remote stream received from:', remoteUserId)
      console.log('Remote stream tracks:', stream.getTracks().map(t => `${t.kind} (${t.enabled ? 'enabled' : 'disabled'})`))
      
      // Store remote stream
      this.remoteStreams.set(remoteUserId, stream)
      
      // Ensure audio is enabled
      stream.getAudioTracks().forEach(track => {
        track.enabled = true
        console.log('Remote audio track enabled:', track.label)
      })
      
      this.emit('remote_stream', { userId: remoteUserId, stream })
    })

    peer.on('connect', () => {
      console.log('🔗 Peer connected successfully with:', remoteUserId)
      this.emit('call_connected', { callId: this.currentCallId })
    })

    peer.on('error', (err) => {
      console.error('❌ Peer error:', err)
      this.emit('call_error', { error: err.message })
    })

    peer.on('close', () => {
      console.log('🔌 Peer connection closed with:', remoteUserId)
      this.peers.delete(remoteUserId)
    })
  }

  // Handle incoming signal
  handleSignal(remoteUserId: string, signal: any): void {
    console.log('📡 Handling signal from:', remoteUserId, signal.type)
    const peer = this.peers.get(remoteUserId)
    if (peer) {
      peer.signal(signal)
      console.log('Signal forwarded to peer')
    } else {
      console.warn('No peer found for user:', remoteUserId)
      console.log('Available peers:', Array.from(this.peers.keys()))
    }
  }

  // Toggle microphone
  toggleMicrophone(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        console.log(`Microphone ${audioTrack.enabled ? 'unmuted' : 'muted'}`)
        return audioTrack.enabled
      }
    }
    console.warn('No audio track found to toggle')
    return false
  }

  // Toggle camera
  toggleCamera(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        console.log(`Camera ${videoTrack.enabled ? 'on' : 'off'}`)
        return videoTrack.enabled
      }
    }
    return true
  }

  // Share screen
  async shareScreen(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const videoTrack = screenStream.getVideoTracks()[0]
      
      // Replace video track for all peers
      this.peers.forEach((peer) => {
        const sender = (peer as any)._pc?.getSenders()?.find((s: any) => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      })
      
      videoTrack.onended = () => {
        this.stopScreenShare()
      }
      
      console.log('Screen sharing started')
      return screenStream
    } catch (error) {
      console.error('Error sharing screen:', error)
      return null
    }
  }

  // Stop screen share
  stopScreenShare(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      this.peers.forEach((peer) => {
        const sender = (peer as any)._pc?.getSenders()?.find((s: any) => s.track?.kind === 'video')
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack)
        }
      })
      console.log('Screen sharing stopped')
    }
  }

  // End current call
  endCall(): void {
    console.log('Ending call...')
    
    // Stop all peer connections
    this.peers.forEach((peer) => {
      peer.destroy()
    })
    this.peers.clear()
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped track: ${track.kind}`)
      })
      this.localStream = null
    }
    
    // Clear remote streams
    this.remoteStreams.clear()
    
    this.isCallActive = false
    this.currentCallId = null
    
    this.emit('call_ended', {})
  }

  // Get local stream for video element
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  // Get remote stream for video element
  getRemoteStream(userId: string): MediaStream | null {
    const stream = this.remoteStreams.get(userId)
    if (stream) {
      // Ensure audio is enabled
      stream.getAudioTracks().forEach(track => {
        track.enabled = true
      })
    }
    return stream
  }

  // Check if call is active
  isInCall(): boolean {
    return this.isCallActive
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set())
    }
    this.callbacks.get(event)?.add(callback)
  }

  off(event: string, callback: Function): void {
    this.callbacks.get(event)?.delete(callback)
  }

  private emit(event: string, data: any): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }
}

export default new WebRTCService()