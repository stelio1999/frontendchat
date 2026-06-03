import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Users, 
  Group, 
  Phone, 
  Settings,
  LogOut,
  Sun,
  Moon,
  X,
  FileText // 🔥 Importado para o Painel pós-reunião
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useThemeStore } from '../../stores/themeStore'
import Avatar from '../common/Avatar'

interface MenuItem {
  icon: React.ReactNode
  label: string
  path: string
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()

  // 🔥 Adicionado o item "Painel pós-reunião" na lista de navegação
  const menuItems: MenuItem[] = [
    { icon: <MessageCircle size={24} />, label: 'Chats', path: '/chats' },
    { icon: <Users size={24} />, label: 'Contactos', path: '/contacts' },
    { icon: <Group size={24} />, label: 'Grupos', path: '/groups' },
    { icon: <Phone size={24} />, label: 'Chamadas', path: '/calls' },
    { icon: <FileText size={24} />, label: 'Painel pós-reunião', path: '/post-meeting' },
    { icon: <Settings size={24} />, label: 'Configurações', path: '/settings' },
  ]

  return (
    <>
      {/* Botão do Menu Mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-whatsapp-green rounded-full text-white shadow-lg hover:bg-whatsapp-dark transition-colors md:hidden"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar Desktop */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-whatsapp-sidebar-dark shadow-lg flex-col z-30">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="lg" showStatus />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">{user?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.status || 'Online'}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto"> {/* Adicionado overflow preventivo se a lista crescer */}
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors
                ${location.pathname === item.path 
                  ? 'bg-whatsapp-green text-white' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
          </button>
          
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Sidebar Mobile */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-whatsapp-sidebar-dark shadow-xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar user={user} size="md" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{user?.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300">
                  <X size={20} />
                </button>
              </div>
              
              <nav className="py-4 flex-1 overflow-y-auto">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors
                      ${location.pathname === item.path 
                        ? 'bg-whatsapp-green text-white' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button
                  onClick={() => { toggleTheme(); setIsOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                  <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                </button>
                
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={20} />
                  <span>Sair</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}