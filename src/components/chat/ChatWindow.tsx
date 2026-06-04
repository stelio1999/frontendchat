import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatHeader from './ChatHeader'
import MessageBubble from './MessageBubble'
import MessageInput from './MessageInput'
import { Chat, Message } from '../../types/chat.types'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'
import socket from '../../services/socket'
import toast from 'react-hot-toast'

interface ChatWindowProps {
  chat: Chat
  onClose?: () => void
}

export default function ChatWindow({ chat, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!chat?.id) return

    try {
      setLoading(true)
      console.log('Loading messages for chat:', chat.id)
      const response = await api.get(`/chats/${chat.id}/messages`)
      console.log('Messages loaded:', response.data.length)
      setMessages(response.data)

      // Mark messages as read
      socket.markAsRead('', chat.id)
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Erro ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }, [chat?.id])

  // Handle new message
  const handleNewMessage = useCallback((message: Message) => {
  if (message.chatId !== chat.id) return

  setMessages(prev => {
    const tempMessage = prev.find(
      m =>
        m.id.startsWith('temp-') &&
        m.senderId === message.senderId &&
        m.content === message.content
    )

    if (tempMessage) {
      return prev.map(m =>
        m.id === tempMessage.id ? message : m
      )
    }

    if (prev.some(m => m.id === message.id)) {
      return prev
    }

    return [...prev, message]
  })
}, [chat.id])
  // Handle message read
  const handleMessageRead = useCallback(({ messageId, userId: readerId }: { messageId: string; userId: string }) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId && msg.senderId === readerId
          ? { ...msg, isRead: true, readAt: new Date() }
          : msg
      )
    )
  }, [])

  // Handle user typing
  const handleUserTyping = useCallback(({ chatId: typingChatId, userId: typingUserId }: { chatId: string; userId: string }) => {
    if (typingChatId === chat.id && typingUserId !== user?.id) {
      setTyping(prev => {
        if (prev.includes(typingUserId)) return prev
        return [...prev, typingUserId]
      })

      // Remove typing indicator after 2 seconds
      setTimeout(() => {
        setTyping(prev => prev.filter(id => id !== typingUserId))
      }, 2000)
    }
  }, [chat.id, user?.id])

  // Handle offline messages
  const handleOfflineMessages = useCallback((offlineMessages: Message[]) => {
    console.log('Received offline messages:', offlineMessages.length)
    setMessages(prev => {
      const newMessages = offlineMessages.filter(msg => !prev.some(p => p.id === msg.id))
      return [...prev, ...newMessages]
    })
  }, [])

  // Send message
  const sendMessage = async (content: string, file?: File) => {
    if (!content.trim() && !file) return

    setSending(true)

    try {
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const tempMessage: Message = {
        id: tempId,
        chatId: chat.id,
        senderId: user?.id || '',
        content,
        fileUrl: file ? URL.createObjectURL(file) : undefined,
        fileType: file?.type,
        isRead: false,
        createdAt: new Date(),
      }

      // Add temp message to UI
      setMessages(prev => [...prev, tempMessage])
      scrollToBottom()

      console.log('Sending message:', { content, chatId: chat.id })

      const formData = new FormData()
      formData.append('content', content)
      formData.append('chatId', chat.id)
      if (file) {
        formData.append('file', file)
      }

      const response = await api.post('/chats/messages', formData)
      const newMessage = response.data

      console.log('Message sent, server response:', newMessage)

      // Replace temp message with real one
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? newMessage : msg
      ))

      // Emit via socket for real-time delivery


    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Erro ao enviar mensagem')
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
    } finally {
      setSending(false)
    }
  }

  // Mark message as read
  const markAsRead = async (messageId: string) => {
    try {
      await api.post(`/messages/${messageId}/read`)
      socket.markAsRead(messageId, chat.id)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  // Typing handlers
  const handleStartTyping = () => {
    socket.startTyping(chat.id, user?.id || '')
  }

  const handleStopTyping = () => {
    socket.stopTyping(chat.id, user?.id || '')
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Setup socket listeners
  useEffect(() => {
    if (!chat?.id) return

    console.log('Setting up socket listeners for chat:', chat.id)

    // Register event handlers
    socket.off('new_message', handleNewMessage)
    socket.on('new_message', handleNewMessage)

    socket.off('message_read', handleMessageRead)
    socket.on('message_read', handleMessageRead)

    socket.off('user_typing', handleUserTyping)
    socket.on('user_typing', handleUserTyping)

    socket.off('offline_messages', handleOfflineMessages)
    socket.on('offline_messages', handleOfflineMessages)
    // Join chat room
    socket.joinChat(chat.id)

    // Load messages
    loadMessages()

    // Get offline messages
    socket.emit('get_offline_messages', {})

    // Cleanup
    return () => {
      console.log('Cleaning up socket listeners for chat:', chat.id)
      socket.off('new_message', handleNewMessage)
      socket.off('message_read', handleMessageRead)
      socket.off('user_typing', handleUserTyping)
      socket.off('offline_messages', handleOfflineMessages)
      socket.leaveChat(chat.id)
    }
  }, [chat.id, handleNewMessage, handleMessageRead, handleUserTyping, handleOfflineMessages, loadMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <ChatHeader chat={chat} onClose={onClose} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
        </div>
      </div>
    )
  }


  return (
<div className="flex flex-col h-[100dvh] md:h-[calc(100vh)] bg-whatsapp-chat-bg-light dark:bg-whatsapp-chat-bg-dark">
  
          <ChatHeader chat={chat} onClose={onClose} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <p className="text-lg mb-2">💬 Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie uma mensagem para começar a conversa</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
              >
                <MessageBubble
      message={message}
      isOwn={message.senderId === user?.id}
      showAvatar={messages[index - 1]?.senderId !== message.senderId}
    />
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {typing.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Alguém está digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={sendMessage}
        onTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  )
}