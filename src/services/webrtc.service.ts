import Peer from 'simple-peer'
console.log('SimplePeer loaded:', typeof Peer)

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

  async initLocalStream(type: 'voice' | 'video'): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video',
      }
      
      console.log('🎥 Requesting media with constraints:', constraints)
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('✅ Local stream obtained. Tracks:', this.localStream.getTracks().map(t => `${t.kind}: ${t.enabled}`))
      return this.localStream
    } catch (error) {
      console.error('❌ Error accessing media devices:', error)
      throw new Error('Could not access camera/microphone')
    }
  }

  async startCall(config: CallConfig, signalCallback: (signal: any) => void): Promise<void> {
    try {
      console.log('📞 Starting call as CALLER:', config)
      
      await this.initLocalStream(config.type)
      if (!this.localStream) {
        throw new Error('Could not initialize local stream')
      }

      console.log('Creating peer connection as initiator...')
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
      
      console.log('✅ Caller peer created')
    } catch (error) {
      console.error('❌ Error starting call:', error)
      throw error
    }
  }

  async answerCall(config: CallConfig, signalCallback: (signal: any) => void): Promise<void> {
    try {
      console.log('📞 Answering call as RECEIVER:', config)
      
      await this.initLocalStream(config.type)
      if (!this.localStream) {
        throw new Error('Could not initialize local stream')
      }

      console.log('Creating peer connection as non-initiator...')
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
      
      console.log('✅ Receiver peer created')
    } catch (error) {
      console.error('❌ Error answering call:', error)
      throw error
    }
  }

  private setupPeerEvents(peer: Peer.Instance, remoteUserId: string, signalCallback: (signal: any) => void) {
    peer.on('signal', (signal) => {
      console.log(`📡 Signal generated for ${remoteUserId}:`, signal.type)
      signalCallback(signal)
    })

    peer.on('stream', (stream) => {
      console.log(`🎥 Remote stream received from ${remoteUserId}!`)
      console.log('Stream tracks:', stream.getTracks().map(t => `${t.kind}: enabled=${t.enabled}, readyState=${t.readyState}`))
      
      // Store remote stream
      this.remoteStreams.set(remoteUserId, stream)
      
      // Force audio and video to be enabled
      stream.getTracks().forEach(track => {
        track.enabled = true
        console.log(`Enabled ${track.kind} track`)
      })
      
      this.emit('remote_stream', { userId: remoteUserId, stream })
    })

    peer.on('connect', () => {
      console.log(`🔗 Peer connected successfully with ${remoteUserId}!`)
      this.emit('call_connected', { callId: this.currentCallId })
    })

    peer.on('error', (err) => {
      console.error(`❌ Peer error with ${remoteUserId}:`, err)
      this.emit('call_error', { error: err.message })
    })

    peer.on('close', () => {
      console.log(`🔌 Peer connection closed with ${remoteUserId}`)
      this.peers.delete(remoteUserId)
    })
  }

  handleSignal(remoteUserId: string, signal: any): void {
    console.log(`📡 Handling signal from ${remoteUserId}:`, signal.type)
    const peer = this.peers.get(remoteUserId)
    if (peer) {
      peer.signal(signal)
      console.log(`✅ Signal forwarded to peer ${remoteUserId}`)
    } else {
      console.warn(`⚠️ No peer found for ${remoteUserId}`)
      console.log('Available peers:', Array.from(this.peers.keys()))
    }
  }

  toggleMicrophone(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        console.log(`🎤 Microphone ${audioTrack.enabled ? 'unmuted' : 'muted'}`)
        return audioTrack.enabled
      }
    }
    return false
  }

  toggleCamera(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        console.log(`📷 Camera ${videoTrack.enabled ? 'on' : 'off'}`)
        return videoTrack.enabled
      }
    }
    return true
  }

  async shareScreen(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const videoTrack = screenStream.getVideoTracks()[0]
      
      this.peers.forEach((peer) => {
        const sender = (peer as any)._pc?.getSenders()?.find((s: any) => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      })
      
      videoTrack.onended = () => this.stopScreenShare()
      console.log('🖥️ Screen sharing started')
      return screenStream
    } catch (error) {
      console.error('Error sharing screen:', error)
      return null
    }
  }

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

  endCall(): void {
    console.log('🔚 Ending call...')
    this.peers.forEach((peer) => peer.destroy())
    this.peers.clear()
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
    
    this.remoteStreams.clear()
    this.isCallActive = false
    this.currentCallId = null
    this.emit('call_ended', {})
  }

  getLocalStream(): MediaStream | null {
    return this.localStream
  }

 getRemoteStream(userId: string): MediaStream | null {
  // Se não passar ID, pega o primeiro fluxo remoto ativo disponível como plano B
  if (!userId || userId === '') {
    const firstStream = Array.from(this.remoteStreams.values())[0];
    if (firstStream) {
      firstStream.getTracks().forEach(track => track.enabled = true);
      return firstStream;
    }
    return null;
  }

  const stream = this.remoteStreams.get(userId);
  if (stream) {
    stream.getTracks().forEach(track => track.enabled = true);
  }
  return stream || null;
}

  isInCall(): boolean {
    return this.isCallActive
  }

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
if (typeof window !== 'undefined') {
  (window as any).webrtcService = WebRTCService
}

export default new WebRTCService()
