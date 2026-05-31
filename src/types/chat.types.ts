export interface Chat {
  id: string
  type: 'private' | 'group'
  name?: string
  avatarUrl?: string
  lastMessage?: Message
  participants: User[]
  unreadCount: number
  createdAt: Date
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  content: string
  fileUrl?: string
  fileType?: string
  isRead: boolean
  deliveredAt?: Date
  readAt?: Date
  createdAt: Date
}

export interface Group {
  id: string
  chatId: string
  name: string
  description?: string
  avatarUrl?: string
  createdBy: string
  members: GroupMember[]
  settings: GroupSettings
  createdAt: Date
}

export interface GroupMember {
  userId: string
  role: 'admin' | 'member'
  joinedAt: Date
  permissions: Permissions
}

export interface Permissions {
  canSendMessages: boolean
  canAddMembers: boolean
  canRemoveMembers: boolean
  canChangeGroupInfo: boolean
}

export interface GroupSettings {
  isPrivate: boolean
  requireApproval: boolean
  announcementOnly: boolean
}