export interface User {
  id: string
  email: string
  phone: string
  name: string
  birthDate: Date
  nationality: string
  avatarUrl?: string
  status: string
  lastSeen: Date
  isOnline: boolean
  createdAt: Date
}

export interface AuthResponse {
  user: User
  token: string
}

export interface RegisterData {
  phone: string
  name: string
  birthDate: Date
  nationality: string
  email: string
}