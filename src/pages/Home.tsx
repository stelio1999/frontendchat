import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import { useChatContext } from '../contexts/ChatContext'
import ChatWindow from '../components/chat/ChatWindow'

export default function Home() {
  const { currentChat, isChatOpen, closeChat } = useChatContext()

  return (
    <div className="flex h-screen bg-whatsapp-chat-bg-light dark:bg-whatsapp-chat-bg-dark">
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-hidden relative">
        <Outlet />
        
        {/* Chat Window Overlay para mobile */}
        {isChatOpen && currentChat && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 z-50 md:relative md:z-0">
            <ChatWindow chat={currentChat} onClose={closeChat} />
          </div>
        )}
      </main>
    </div>
  )
}