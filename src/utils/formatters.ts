import { format, formatDistanceToNow, formatRelative } from 'date-fns'
import { pt } from 'date-fns/locale'

export const formatDate = (date: Date | string, pattern: string = 'PPp'): string => {
  const d = new Date(date)
  return format(d, pattern, { locale: pt })
}

export const formatRelativeTime = (date: Date | string): string => {
  const d = new Date(date)
  return formatDistanceToNow(d, { addSuffix: true, locale: pt })
}

export const formatChatTime = (date: Date | string): string => {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  
  if (isToday) {
    return format(d, 'HH:mm', { locale: pt })
  }
  
  const isThisWeek = now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000
  if (isThisWeek) {
    return format(d, 'EEEE', { locale: pt })
  }
  
  return format(d, 'dd/MM/yyyy', { locale: pt })
}

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}