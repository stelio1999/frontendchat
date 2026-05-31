import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

export const useNotification = () => {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [user])

  const sendNotification = (title: string, body: string, icon?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon })
    }
  }

  return { sendNotification }
}