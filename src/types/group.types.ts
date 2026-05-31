export interface Group {
  id: string
  name: string
  description?: string
  avatarUrl?: string
  createdBy: string
  createdAt: Date
  members: GroupMember[]
  settings: GroupSettings
  unreadCount?: number
}

export interface GroupMember {
  userId: string
  userName: string
  userAvatar?: string
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
  allowMedia: boolean
  allowLinks: boolean
}