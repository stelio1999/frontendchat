// 🔥 POLYFILL CRÍTICO: Executado antes de qualquer import de módulo para salvar o SimplePeer
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  // Injeta o nextTick que o simple-peer tanto precisa
  window.process.nextTick = window.process.nextTick || function (fn: Function, ...args: any[]) {
    setTimeout(() => fn(...args), 0);
  };
}

console.log('main')
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App'

import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { SocketProvider } from './contexts/SocketContext'
import { CallProvider } from './contexts/CallContext'

import { APP_CONFIG } from './utils/constants'

import './styles/globals.css'
import './styles/themes.css'
import './styles/animations.css'

import { Buffer } from 'buffer'

window.Buffer = Buffer

console.log(APP_CONFIG.googleClientId)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={APP_CONFIG.googleClientId}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <CallProvider>
                <App />
              </CallProvider>
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
)