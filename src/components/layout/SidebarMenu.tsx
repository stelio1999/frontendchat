import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  MessageCircle, 
  Users, 
  Group, 
  Phone, 
  Settings,
  CallHistory 
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  path: string
}

const menuItems: MenuItem[] = [
  { icon: <MessageCircle size={22} />, label: 'Chats', path: '/chats' },
  { icon: <Users size={22} />, label: 'Contactos', path: '/contacts' },
  { icon: <Group size={22} />, label: 'Grupos', path: '/groups' },
  { icon: <Phone size={22} />, label: 'Chamadas', path: '/calls' },
  { icon: <CallHistory size={22} />, label: 'Histórico', path: '/call-history' },
  { icon: <Settings size={22} />, label: 'Configurações', path: '/settings' },
]

interface SidebarMenuProps {
  onItemClick?: () => void
}

export default function SidebarMenu({ onItemClick }: SidebarMenuProps) {
  const location = useLocation()

  return (
    <nav className="flex-1 py-4">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onItemClick}
          className={`
            flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200
            ${location.pathname === item.path 
              ? 'bg-whatsapp-green text-white shadow-md' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
          `}
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}