import React, { useState } from 'react'
import { 
  ArrowLeft, MoreVertical, Phone, Video, Info, 
  Bell, Pin, Search, Users, Shield, Calendar
} from 'lucide-react'
import Avatar from '../common/Avatar'
import { Chat } from '../../types/chat.types'
import { useNavigate } from 'react-router-dom'
import GroupInfo from '../group/GroupInfo'
import toast from 'react-hot-toast'
import api from '../../services/api'
import socket from '../../services/socket' 
import { usePresenceStore } from '../../stores/PresenceStore'
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
  const isOnline = usePresenceStore(state => state.isOnline(chat.otherUserId))

  // Para chamada privada
  const handlePrivateCall = async (type: 'voice' | 'video') => {
    if (chat.type === 'private' && chat.participants && chat.participants[0]) {
      await startCall(chat.id, type, chat.participants[0].id)
    }
  }

  // Para chamada em grupo - Entra diretamente na sala e convida todos automaticamente
  const handleGroupCall = async (type: 'voice' | 'video') => {
    if (chat.type !== 'group') return
    
    setShowMenu(false)
    const loadingToastId = toast.loading('A iniciar reunião de grupo...')

    try {
      // 1. Procura o grupo associado ao chat para capturar os membros
      const groupResponse = await api.get(`/groups/by-chat/${chat.id}`)
      const group = groupResponse.data
      
      const detailsResponse = await api.get(`/groups/${group.id}`)
      const members = detailsResponse.data.members || []
      
      // 2. Filtra o usuário atual logado
      const currentUserId = localStorage.getItem('userId')
      const otherMembers = members.filter((m: any) => m.userId !== currentUserId)
      
      if (otherMembers.length === 0) {
        toast.error('O grupo não tem outros participantes para chamar.', { id: loadingToastId })
        return
      }

      // Mapeia os IDs de todos os outros participantes do grupo
      const allParticipantIds = otherMembers.map((p: any) => p.userId || p.id)
      const firstParticipantId = allParticipantIds[0]

      // 3. Inicializa a chamada no backend usando o primeiro participante como receiverId
      const response = await api.post('/calls/start', { 
        chatId: chat.id, 
        type: type, 
        receiverId: firstParticipantId 
      })
      
      const call = response.data
      const meetingLink = `${window.location.origin}/group-call/${chat.id}?type=${type}`

      // 4. Posta o link da reunião no grupo de forma assíncrona
      // DENTRO DE handleGroupCall NO CHATHEADER.TSX
// Substitui a parte do formData.append('content', ...) por isto:

try {
  const formData = new FormData()
  // Enviamos uma tag estruturada que o MessageBubble saberá interpretar
  formData.append('content', `[CALL_GROUP_ACTIVE]:${chat.id}:${type}`)
  formData.append('chatId', chat.id)
  await api.post('/chats/messages', formData)
} catch (msgError) {
  console.error('Erro ao postar link da reunião no grupo:', msgError)
}

      // 5. Emite o sinal via WebSockets para fazer tocar na tela de TODOS os membros do grupo
      allParticipantIds.forEach((participantId) => {
        socket.emit('group_call_invite', {
          callId: call.id,
          chatId: chat.id,
          receiverId: participantId,
          callerId: currentUserId,
          type: type,
        })
      })

      toast.success('Reunião criada com sucesso!', { id: loadingToastId })

      // 6. Redireciona imediatamente o criador para a sala de vídeo/voz dinamicamente
      navigate(`/group-call/${chat.id}?type=${type}`)

    } catch (error) {
      console.error('Error starting direct group call:', error)
      toast.error('Erro ao iniciar chamada em grupo direta', { id: loadingToastId })
    }
  }

  const handleViewInfo = async () => {
    if (chat.type === 'group') {
      try {
        const response = await api.get(`/groups/by-chat/${chat.id}`)
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
      toast.success('Funcionalidade em desenvolvimento')
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
              onClick={() => chat.type === 'private' ? handlePrivateCall('voice') : handleGroupCall('voice')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Chamada de voz"
            >
              <Phone size={20} />
            </button>
            
            <button
              onClick={() => chat.type === 'private' ? handlePrivateCall('video') : handleGroupCall('video')}
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

      {/* O Modal antigo foi inteiramente removido daqui para evitar estados mortos e código quebrado */}

      {/* Group Info Modal */}
      {showGroupInfo && groupData && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl animate-slide-in-right">
            <GroupInfo
              group={groupData}
              chatId={chat.id}
              currentUserId={localStorage.getItem('userId') || ''}
              onUpdate={() => handleViewInfo()}
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