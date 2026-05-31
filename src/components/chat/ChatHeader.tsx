import React, { useState } from 'react'
import { 
  ArrowLeft, MoreVertical, Phone, Video, Info, 
  Bell, Pin, Search, User, Users, Shield, Calendar 
} from 'lucide-react'
import Avatar from '../common/Avatar'
import { Chat } from '../../types/chat.types'
import { useNavigate } from 'react-router-dom'
import GroupInfo from '../group/GroupInfo'
import Modal from '../common/Modal'
import { toast } from 'react-hot-toast'
import api from '../../services/api'
import { usePresenceStore } from '../../stores/presenceStore'
import { useCall } from '../../hooks/useCall'



interface ChatHeaderProps {
  chat: Chat
  onClose?: () => void
}

export default function ChatHeader({ chat, onClose }: ChatHeaderProps) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [groupData, setGroupData] = useState<any>(null)

  const { startCall } = useCall()

const handleCall = async (type: 'voice' | 'video') => {
  if (chat.type === 'private' && chat.participants[0]) {
    await startCall(chat.id, type, chat.participants[0].id)
  } else if (chat.type === 'group') {
    // For groups, show modal to select participants
    toast.info('Selecione os participantes para a chamada')
  }
}


  const isOnline = usePresenceStore(
  state => state.isOnline(chat.otherUserId)
)

  const handleViewInfo = async () => {
    if (chat.type === 'group') {
      try {
        const response = await api.get(`/groups/${chat.id}`)
        setGroupData(response.data)
        setShowGroupInfo(true)
      } catch (error) {
        console.error('Error loading group info:', error)
        toast.error('Erro ao carregar informações do grupo')
      }
    } else {
      navigate(`/contacts`)
    }
    setShowMenu(false)
  }

  const handleScheduleMeeting = () => {
    if (chat.type === 'group') {
      setShowMenu(false)
      // Open schedule meeting modal
    }
  }


  
  return (
    <>
      <div className="bg-white dark:bg-whatsapp-header-dark border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            
            <div onClick={handleViewInfo} className="flex items-center gap-3 cursor-pointer">
              <Avatar name={chat.name} avatarUrl={chat.avatarUrl} size="lg" showStatus />
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{chat.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {chat.type === 'group' 
                    ? `${chat.participants?.length || 0} participantes` 
                    : isOnline ? 'Online' : 'Offline'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCall('voice')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Chamada de voz"
            >
              <Phone size={20} />
            </button>
            
            <button
              onClick={() => handleCall('video')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Chamada de vídeo"
            >
              <Video size={20} />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden">
                    <button 
                      onClick={handleViewInfo}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Info size={18} />
                      Informações do {chat.type === 'group' ? 'grupo' : 'contacto'}
                    </button>
                    
                    {chat.type === 'group' && (
                      <>
                        <button 
                          onClick={handleScheduleMeeting}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Calendar size={18} />
                          Agendar reunião
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Users size={18} />
                          Ver membros
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Shield size={18} />
                          Permissões
                        </button>
                      </>
                    )}
                    
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Search size={18} />
                      Pesquisar mensagens
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Pin size={18} />
                      Fixar conversa
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Bell size={18} />
                      Silenciar notificações
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && groupData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl animate-slide-in-right">
            <GroupInfo
  group={groupData}
  chatId={chat.id}
  currentUserId={localStorage.getItem('userId') || ''}

  onUpdate={() => {
    handleViewInfo()
  }}

  onAddMembers={async (userIds: string[]) => {
    try {
      await api.post(`/groups/${groupData.id}/members`, { userIds })

      toast.success('Membros adicionados com sucesso')

      const response = await api.get(`/groups/${groupData.id}`)
      setGroupData(response.data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar membros')
    }
  }}

  onRemoveMember={async (userId: string) => {
    try {
      await api.delete(`/groups/${groupData.id}/members/${userId}`)

      toast.success('Membro removido')

      const response = await api.get(`/groups/${groupData.id}`)
      setGroupData(response.data)
    } catch (error) {
      console.error(error)
      toast.error('Erro ao remover membro')
    }
  }}

  onClose={() => setShowGroupInfo(false)}
/>
          </div>
        </div>
      )}
    </>
  )
}