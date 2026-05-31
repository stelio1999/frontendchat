import { create } from 'zustand'

interface PresenceState {
  onlineUsers: Set<string>
  setOnline: (userId: string) => void
  setOffline: (userId: string) => void
  isOnline: (userId: string) => boolean
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUsers: new Set(),

  setOnline: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers)
      updated.add(userId)
      return { onlineUsers: updated }
    }),

/* CORRETO */
  setOffline: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers)
      updated.delete(userId)
      return { onlineUsers: updated }
    }),

/* helper */
  isOnline: (userId) => {
    return get().onlineUsers.has(userId)
  }
}))