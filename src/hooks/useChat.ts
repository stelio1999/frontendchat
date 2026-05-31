import { useState, useEffect, useCallback } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'
import socket from '../services/socket'
import { Chat, Message } from '../types/chat.types'

export const useChat = (chatId?: string) => {
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const { chats, currentChat, setCurrentChat, addMessage, markAsRead } = useChatStore()
  const { user } = useAuthStore()

  const loadChats = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/chats')
      // Update store with chats
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMessages = useCallback(async () => {
    if (!chatId) return
    setLoading(true)
    try {
      const response = await api.get(`/chats/${chatId}/messages`)
      setMessages(response.data)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }, [chatId])

  const sendMessage = async (content: string, file?: File) => {
    if (!chatId) return
    try {
      const formData = new FormData()
      formData.append('content', content)
      formData.append('chatId', chatId)
      if (file) formData.append('file', file)

      const response = await api.post('/messages', formData)
      const newMessage = response.data
      addMessage(chatId, newMessage)
      socket.emit('send_message', newMessage)
      return newMessage
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    if (!chatId) return
    try {
      await api.post(`/messages/${messageId}/read`)
      socket.emit('message_read', { messageId, chatId })
      markAsRead(chatId)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const startTyping = () => {
    if (chatId) {
      socket.emit('typing', { chatId, userId: user?.id })
    }
  }

  const stopTyping = () => {
    if (chatId) {
      socket.emit('stop_typing', { chatId, userId: user?.id })
    }
  }

  useEffect(() => {
    if (chatId) {
      loadMessages()
    }
  }, [chatId, loadMessages])

  return {
    chats,
    currentChat,
    messages,
    loading,
    setCurrentChat,
    sendMessage,
    markMessageAsRead,
    startTyping,
    stopTyping,
    loadChats,
  }
}