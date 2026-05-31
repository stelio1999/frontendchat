import api from './api'
import { Call, ScheduledMeeting } from '../types/call.types'

export const callService = {
  async startCall(data: { chatId: string; type: 'voice' | 'video' }) {
    const response = await api.post<Call>('/calls/start', data)
    return response.data
  },

  async endCall(callId: string) {
    const response = await api.post(`/calls/${callId}/end`)
    return response.data
  },

  async getCallHistory() {
    const response = await api.get<Call[]>('/calls/history')
    return response.data
  },

  async scheduleMeeting(data: {
    groupId: string
    title: string
    scheduledFor: Date
    participants: string[]
  }) {
    const response = await api.post<ScheduledMeeting>('/meetings/schedule', data)
    return response.data
  },

  async getMeetings(groupId: string) {
    const response = await api.get<ScheduledMeeting[]>(`/groups/${groupId}/meetings`)
    return response.data
  },

  async joinMeeting(meetingId: string) {
    const response = await api.post(`/meetings/${meetingId}/join`)
    return response.data
  },
}