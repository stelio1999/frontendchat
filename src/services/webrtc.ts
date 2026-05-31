import Peer from 'simple-peer'

export class WebRTCService {
  private peers: Map<string, Peer.Instance> = new Map()
  private localStream: MediaStream | null = null

  async initLocalStream(constraints?: MediaStreamConstraints) {
  if (this.localStream) return this.localStream

  this.localStream = await navigator.mediaDevices.getUserMedia(
    constraints || { video: true, audio: true }
  )

  return this.localStream
}

  createPeer(userId: string, initiator: boolean, stream: MediaStream, onSignal: (signal: any) => void) {
    const peer = new Peer({ initiator, stream, trickle: false })
    
    peer.on('signal', (signal) => {
      onSignal(signal)
    })
    
    peer.on('stream', (remoteStream) => {
      this.handleRemoteStream(userId, remoteStream)
    })
    
    peer.on('error', (err) => {
      console.error('Peer error:', err)
    })
    
    peer.on('close', () => {
      this.peers.delete(userId)
    })
    
    this.peers.set(userId, peer)
    return peer
  }

  signalPeer(userId: string, signal: any) {
    const peer = this.peers.get(userId)
    if (peer) {
      peer.signal(signal)
    }
  }

  handleRemoteStream(userId: string, stream: MediaStream) {
    // Handle remote stream
    const event = new CustomEvent('remoteStream', { detail: { userId, stream } })
    window.dispatchEvent(event)
  }

  async shareScreen() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      const videoTrack = screenStream.getVideoTracks()[0]
      
      // Replace video track for all peers
      this.peers.forEach((peer) => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      })
      
      videoTrack.onended = () => {
        this.stopScreenShare()
      }
      
      return screenStream
    } catch (error) {
      console.error('Error sharing screen:', error)
      throw error
    }
  }

  stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      this.peers.forEach((peer) => {
        const sender = peer._pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      })
    }
  }

  endAllCalls() {
    this.peers.forEach((peer) => {
      peer.destroy()
    })
    this.peers.clear()
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
  }
}

export default new WebRTCService()