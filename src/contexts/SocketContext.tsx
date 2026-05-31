import React, { createContext, useContext, ReactNode } from 'react'
import { useSocket } from '../hooks/useSocket'
import { Socket } from 'socket.io-client'

interface SocketContextData {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextData>({} as SocketContextData)

export const useSocketContext = () => useContext(SocketContext)

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { socket } = useSocket()
  const isConnected = socket?.connected || false

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}