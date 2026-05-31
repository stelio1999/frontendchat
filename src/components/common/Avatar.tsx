import React from 'react'
import { User } from '../../types/user.types'
import { usePresenceStore } from '../../stores/PresenceStore'

interface AvatarProps {
  user?: User
  name?: string
  avatarUrl?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatus?: boolean
  isOnline?: boolean
}

export default function Avatar({ 
  user, 
  name, 
  avatarUrl, 
  size = 'md', 
  showStatus = false,
  isOnline = false 
}: AvatarProps) {
  const displayName = user?.name || name || '?'
  const initials = displayName.charAt(0).toUpperCase()
  const imageUrl = avatarUrl || user?.avatarUrl
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }
const presence = usePresenceStore(state => state.isOnline)

const online = user?.id ? presence(user.id) : isOnline
  return (
    <div className="relative inline-block">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className={`${sizeClasses[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-whatsapp-green flex items-center justify-center text-white font-semibold`}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 border-2 border-white dark:border-gray-800 rounded-full ${
            online ? 'bg-green-500' : 'bg-gray-400'
          } ${size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}`}
        />
      )}
    </div>
  )
}