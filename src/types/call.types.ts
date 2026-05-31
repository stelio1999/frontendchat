export interface Call {
  id: string
  callerId: string
  receiverId: string
  chatId: string
  type: 'voice' | 'video'
  status: 'pending' | 'ongoing' | 'ended' | 'missed' | 'rejected'
  startedAt?: Date
  endedAt?: Date
  duration?: number
}

export interface ScheduledMeeting {
  id: string
  groupId: string
  title: string
  scheduledFor: Date
  participants: string[]
  createdBy: string
  meetingUrl: string
}