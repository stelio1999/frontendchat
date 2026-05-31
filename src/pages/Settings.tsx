import React, { useState } from 'react'
import { 
  User, Bell, Lock, Moon, Globe, Shield, 
  Camera, Edit2, LogOut, Trash2, HelpCircle, 
  Smartphone, Mail, MapPin, Calendar, ChevronRight
} from 'lucide-react'
import Header from '../components/layout/Header'
import Avatar from '../components/common/Avatar'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Input } from '../components/common/Input'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    status: user?.status || '',
  })

  const handleUpdate = async () => {
    try {
      // API call to update user
      toast.success('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Sessão encerrada')
  }

  const settingsSections = [
    {
      title: 'Perfil',
      items: [
        { icon: User, label: 'Informações pessoais', onClick: () => setIsEditing(true) },
        { icon: Camera, label: 'Alterar foto', onClick: () => toast.info('Funcionalidade em breve') },
        { icon: Edit2, label: 'Status', value: user?.status, onClick: () => setIsEditing(true) },
      ],
    },
    {
      title: 'Preferências',
      items: [
        { icon: Moon, label: 'Tema', value: theme === 'light' ? 'Claro' : 'Escuro', onClick: toggleTheme },
        { icon: Bell, label: 'Notificações', onClick: () => toast.info('Funcionalidade em breve') },
        { icon: Globe, label: 'Idioma', value: 'Português (Moçambique)', onClick: () => toast.info('Funcionalidade em breve') },
      ],
    },
    {
      title: 'Segurança',
      items: [
        { icon: Lock, label: 'Alterar senha', onClick: () => toast.info('Funcionalidade em breve') },
        { icon: Shield, label: 'Privacidade', onClick: () => toast.info('Funcionalidade em breve') },
        { icon: Smartphone, label: 'Dispositivos conectados', onClick: () => toast.info('Funcionalidade em breve') },
      ],
    },
    {
      title: 'Sobre',
      items: [
        { icon: HelpCircle, label: 'Ajuda', onClick: () => toast.info('Funcionalidade em breve') },
        { icon: Trash2, label: 'Apagar conta', onClick: () => toast.info('Funcionalidade em breve') },
      ],
    },
  ]

  return (
    <div className="h-full flex flex-col">
      <Header title="Configurações" />

      <div className="flex-1 overflow-y-auto">
        {/* Profile Header */}
        <div className="bg-whatsapp-green/10 p-6 flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar user={user} size="xl" />
            <button className="absolute bottom-0 right-0 p-1.5 bg-whatsapp-green rounded-full text-white">
              <Camera size={14} />
            </button>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
          <p className="text-sm text-gray-500">{user?.status || 'Online'}</p>
          <p className="text-xs text-gray-400 mt-1">{user?.phone}</p>
        </div>

        {/* Settings Sections */}
        <div className="p-4 space-y-6">
          {settingsSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={item.onClick}
                    className={`
                      w-full flex items-center justify-between p-4 
                      ${itemIdx !== section.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={20} className="text-gray-500" />
                      <span className="text-gray-900 dark:text-white">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-sm text-gray-500">{item.value}</span>
                      )}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="danger"
            className="mt-4"
          >
            <LogOut size={18} className="mr-2" />
            Sair da conta
          </Button>

          {/* Version */}
          <p className="text-center text-xs text-gray-400 py-4">
            Versão 1.0.0 • © 2024 WhatsApp Clone Moçambique
          </p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Editar Perfil"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            placeholder="Digite seu status..."
          />
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} fullWidth>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} fullWidth>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}