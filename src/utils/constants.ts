export const APP_CONFIG = {
  name: 'WhatsApp Clone Moçambique',
  version: '1.0.0',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
}

export const STORAGE_KEYS = {
  TOKEN: '@WhatsApp:token',
  USER: '@WhatsApp:user',
  THEME: '@WhatsApp:theme',
  LANGUAGE: '@WhatsApp:language',
}

export const FILE_CONFIG = {
  maxSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'application/pdf'],
  imageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videoTypes: ['video/mp4', 'video/webm', 'video/ogg'],
  audioTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  documentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}

export const CALL_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  videoConstraints: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
}

export const MESSAGE_CONFIG = {
  maxLength: 4096,
  typingTimeout: 2000, // ms
  readReceiptDelay: 1000, // ms
}