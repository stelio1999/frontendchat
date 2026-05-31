import api from './api'
import { Chat, Message } from '../types/chat.types'

export const chatService = {
  async getChats() {
    const response = await api.get<Chat[]>('/chats')
    return response.data
  },

  async getChat(chatId: string) {
    const response = await api.get<Chat>(`/chats/${chatId}`)
    return response.data
  },

  async getMessages(chatId: string, page?: number, limit?: number) {
    const response = await api.get<Message[]>(`/chats/${chatId}/messages`, {
      params: { page, limit },
    })
    return response.data
  },

  async sendMessage(chatId: string, content: string, file?: File) {
    const formData = new FormData()
    formData.append('content', content)
    formData.append('chatId', chatId)
    if (file) {
      formData.append('file', file)
    }
    
    const response = await api.post<Message>('/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async markAsRead(messageId: string) {
    const response = await api.post(`/messages/${messageId}/read`)
    return response.data
  },

  async deleteMessage(messageId: string) {
    const response = await api.delete(`/messages/${messageId}`)
    return response.data
  },

  async searchMessages(chatId: string, query: string) {
    const response = await api.get<Message[]>(`/chats/${chatId}/search`, {
      params: { q: query },
    })
    return response.data
  },
}