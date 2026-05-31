import { useEffect, useState } from 'react'
import socket from '../services/socket'
import { useAuthStore } from '../stores/authStore'
import { usePresenceStore } from '../stores/PresenceStore'

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const { token, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !token) return

    socket.connect(token)

    const onlineHandler = ({ userId }: any) => {
      usePresenceStore.getState().setOnline(userId)
    }

    const offlineHandler = ({ userId }: any) => {
      usePresenceStore.getState().setOffline(userId)
    }

    const onlineUsersHandler = (users: string[]) => {
      const store = usePresenceStore.getState()

      users.forEach(id => {
        store.setOnline(id)
      })
    }

    socket.on('user_online', onlineHandler)
    socket.on('user_offline', offlineHandler)
    socket.on('online_users', onlineUsersHandler)

    socket.onConnectionChange(setIsConnected)

    return () => {
      socket.off('user_online', onlineHandler)
      socket.off('user_offline', offlineHandler)
      socket.off('online_users', onlineUsersHandler)
    }
  }, [isAuthenticated, token])

  return { socket, isConnected }
}