import { io, Socket } from 'socket.io-client'

class SocketService {
  private socket: Socket | null = null
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map()
  private connectionCallbacks: Set<(connected: boolean) => void> = new Set()

  connect(token: string): Socket {
    if (this.socket?.connected) {
      console.log('Socket already connected, ID:', this.socket.id)
      return this.socket
    }

    if (this.socket && !this.socket.connected) {
      console.log('Socket exists but disconnected, reconnecting...')
      this.socket.connect()
      return this.socket
    }

    console.log('Creating new socket connection...')
    
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    // Setup event listeners directly (no external function call)
    this.socket.on('connect', () => {
      console.log('✅ SOCKET CONNECTED! ID:', this.socket?.id)
      this.connectionCallbacks.forEach(cb => cb(true))
      this.socket?.emit('join_personal_room')
      this.socket?.emit('get_offline_messages')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      this.connectionCallbacks.forEach(cb => cb(false))
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
    })

    // Log ALL incoming events for debugging
    this.socket.onAny((event, ...args) => {
      console.log(`📡 [SOCKET EVENT] ${event}:`, args[0])
    })

    // Chat events
    this.socket.on('new_message', (data) => {
      console.log('🎯 new_message:', data)
      this.notifyHandlers('new_message', data)
    })

    this.socket.on('message_read', (data) => {
      console.log('🎯 message_read:', data)
      this.notifyHandlers('message_read', data)
    })

    this.socket.on('user_typing', (data) => {
      console.log('🎯 user_typing:', data)
      this.notifyHandlers('user_typing', data)
    })

    this.socket.on('user_stop_typing', (data) => {
      console.log('🎯 user_stop_typing:', data)
      this.notifyHandlers('user_stop_typing', data)
    })

    this.socket.on('user_online', (data) => {
      console.log('🎯 user_online:', data)
      this.notifyHandlers('user_online', data)
    })

    this.socket.on('user_offline', (data) => {
      console.log('🎯 user_offline:', data)
      this.notifyHandlers('user_offline', data)
    })

    this.socket.on('offline_messages', (data) => {
      console.log('🎯 offline_messages:', data)
      this.notifyHandlers('offline_messages', data)
    })

    // Call events
    this.socket.on('incoming_call', (data) => {
      console.log('🔔🔔🔔 incoming_call:', data)
      this.notifyHandlers('incoming_call', data)
    })

    this.socket.on('start_call', (data) => {
      console.log('📞 start_call:', data)
      this.notifyHandlers('start_call', data)
    })

    this.socket.on('call_accepted', (data) => {
      console.log('✅ call_accepted:', data)
      this.notifyHandlers('call_accepted', data)
    })

    this.socket.on('call_rejected', (data) => {
      console.log('❌ call_rejected:', data)
      this.notifyHandlers('call_rejected', data)
    })

    this.socket.on('call_ended', (data) => {
      console.log('🔚 call_ended:', data)
      this.notifyHandlers('call_ended', data)
    })

    this.socket.on('call_signal', (data) => {
      console.log('📡 call_signal:', data)
      this.notifyHandlers('call_signal', data)
    })

    this.socket.on('user_toggled_audio', (data) => {
      console.log('🎤 user_toggled_audio:', data)
      this.notifyHandlers('user_toggled_audio', data)
    })

    this.socket.on('user_toggled_video', (data) => {
      console.log('📹 user_toggled_video:', data)
      this.notifyHandlers('user_toggled_video', data)
    })

    this.socket.on('chat_read', (data) => {
      console.log('📖 chat_read:', data)
      this.notifyHandlers('chat_read', data)
    })

    // DENTRO DO MÉTODO connect() DO SocketService.ts, junta isto:

// WebRTC Meeting Events
this.socket.on('room_users', (data) => {
  console.log('🎯 room_users interceptado pelo Service:', data)
  this.notifyHandlers('room_users', data)
})

this.socket.on('user_joined', (data) => {
  console.log('🎯 user_joined interceptado pelo Service:', data)
  this.notifyHandlers('user_joined', data)
})

this.socket.on('user_left', (data) => {
  console.log('🎯 user_left interceptado pelo Service:', data)
  this.notifyHandlers('user_left', data)
})

    // Make socket globally available for debugging
    ;(window as any).socket = this.socket
    ;(window as any).socketService = this

    return this.socket
  }

  notifyHandlers(event: string, data: any) {
    const handlers = this.messageHandlers.get(event)
    if (handlers && handlers.size > 0) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (err) {
          console.error(`Error in handler for ${event}:`, err)
        }
      })
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, new Set())
    }
    this.messageHandlers.get(event)?.add(callback)
    console.log(`Registered handler for: ${event}, total: ${this.messageHandlers.get(event)?.size}`)
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.messageHandlers.get(event)?.delete(callback)
    } else {
      this.messageHandlers.delete(event)
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      console.log(`📤 [EMIT] ${event}:`, data)
      this.socket.emit(event, data)
    } else {
      console.warn(`⚠️ Socket not connected, cannot emit: ${event}`)
    }
  }

  joinChat(chatId: string) {
    console.log(`Joining chat room: ${chatId}`)
    this.emit('join_chat', chatId)
  }

  leaveChat(chatId: string) {
    console.log(`Leaving chat room: ${chatId}`)
    this.emit('leave_chat', chatId)
  }

  sendMessage(messageData: any) {
    console.log(`Sending message:`, messageData)
    this.emit('send_message', messageData)
  }

  markAsRead(messageId: string, chatId: string) {
    this.emit('message_read', { messageId, chatId })
  }

  startTyping(chatId: string, userId: string) {
    this.emit('typing', { chatId, userId })
  }

  stopTyping(chatId: string, userId: string) {
    this.emit('stop_typing', { chatId, userId })
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionCallbacks.add(callback)
    if (this.socket) {
      callback(this.socket.connected)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.messageHandlers.clear()
    this.connectionCallbacks.clear()
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export default new SocketService()