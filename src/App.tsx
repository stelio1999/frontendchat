import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { useThemeStore } from './stores/themeStore'
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterStep1 from './pages/RegisterStep1'
import RegisterStep2 from './pages/RegisterStep2'
import Home from './pages/Home'
import Chats from './pages/Chats'
import Contacts from './pages/Contacts'
import Groups from './pages/Groups'
import Calls from './pages/Calls'
import CallHistory from './pages/CallHistory'
import Settings from './pages/Settings'
import CallView from './components/call/CallView'
import CallListener from './components/call/CallListener'
import ProtectedRoute from './components/common/ProtectedRoute'
import { ChatProvider } from './contexts/ChatContext'
import socket from './services/socket'
import ConnectionTest from './components/call/ConnectionTest'

function App() {
  const { isAuthenticated, checkAuth, user, token } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
    document.documentElement.className = theme
  }, [theme, checkAuth])

  // Connect socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('App: Connecting socket for user:', user?.id)
      socket.connect(token)
    }
  }, [isAuthenticated, token, user])

  return (
    <BrowserRouter>
      <ChatProvider>
        <div className="h-screen w-screen overflow-hidden">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/step1" element={<RegisterStep1 />} />
            <Route path="/register/step2" element={<RegisterStep2 />} />
            <Route path="/call/:callId" element={<CallView />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />}>
                <Route index element={<Navigate to="/chats" />} />
                <Route path="chats" element={<Chats />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="groups" element={<Groups />} />
                <Route path="calls" element={<Calls />} />
                <Route path="call-history" element={<CallHistory />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: theme === 'dark' ? '#202C33' : '#fff',
                color: theme === 'dark' ? '#fff' : '#000',
              },
            }}
          />
         {/* {isAuthenticated && <ConnectionTest />}
            */}
          {isAuthenticated && user && <CallListener currentUserId={user.id} />}
        </div>
      </ChatProvider>
    </BrowserRouter>
  )
}

export default App