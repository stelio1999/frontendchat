import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Chat } from '../types/chat.types'

interface ChatContextData {
  currentChat: Chat | null
  setCurrentChat: (chat: Chat | null) => void
  isChatOpen: boolean
  openChat: (chat: Chat) => void
  closeChat: () => void
}

const ChatContext = createContext<ChatContextData>({} as ChatContextData)

export const useChatContext = () => useContext(ChatContext)

interface ChatProviderProps {
  children: ReactNode
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const openChat = (chat: Chat) => {
    setCurrentChat(chat)
    setIsChatOpen(true)
  }

  const closeChat = () => {
    setCurrentChat(null)
    setIsChatOpen(false)
  }

  return (
    <ChatContext.Provider value={{
      currentChat,
      setCurrentChat,
      isChatOpen,
      openChat,
      closeChat,
    }}>
      {children}
    </ChatContext.Provider>
  )
}