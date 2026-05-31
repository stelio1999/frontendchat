import { create } from 'zustand'
import { Chat, Message } from '../types/chat.types'

interface ChatState {
  chats: Chat[]
  currentChat: Chat | null
  messages: Map<string, Message[]>
  unreadCounts: Map<string, number>
  setCurrentChat: (chat: Chat | null) => void
  addMessage: (chatId: string, message: Message) => void
  markAsRead: (chatId: string) => void
  updateUnreadCount: (chatId: string, count: number) => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChat: null,
  messages: new Map(),
  unreadCounts: new Map(),

  setCurrentChat: (chat) => {
    set({ currentChat: chat })
    if (chat) {
      get().markAsRead(chat.id)
    }
  },

  addMessage: (chatId, message) => {
    const messages = get().messages
    const chatMessages = messages.get(chatId) || []
    messages.set(chatId, [...chatMessages, message])
    
    if (get().currentChat?.id !== chatId && !message.isRead) {
      const count = get().unreadCounts.get(chatId) || 0
      get().unreadCounts.set(chatId, count + 1)
    }
    
    set({ messages: new Map(messages), unreadCounts: new Map(get().unreadCounts) })
  },

  markAsRead: (chatId) => {
    get().unreadCounts.set(chatId, 0)
    set({ unreadCounts: new Map(get().unreadCounts) })
  },

  updateUnreadCount: (chatId, count) => {
    get().unreadCounts.set(chatId, count)
    set({ unreadCounts: new Map(get().unreadCounts) })
  },
}))