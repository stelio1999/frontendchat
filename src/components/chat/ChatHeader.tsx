import React, { useState } from 'react'
import { 
  ArrowLeft, MoreVertical, Phone, Video, Info, 
  Bell, Pin, Search, User, Users, Shield, Calendar, X
} from 'lucide-react'
import Avatar from '../common/Avatar'
import { Chat } from '../../types/chat.types'
import { useNavigate } from 'react-router-dom'
import GroupInfo from '../group/GroupInfo'
import Modal from '../common/Modal'
import Button from '../common/Button'
import toast from 'react-hot-toast'
import api from '../../services/api'
import socket from '../../services/socket' // ◀️ Certifica-te de que o socket está importado aqui
import { usePresenceStore } from '../../stores/PresenceStore'
import { useCall } from '../../hooks/useCall'
import axios from 'axios' // ◀️ ADICIONA ESTA LINHA AQUI NO TOPO!
interface ChatHeaderProps {
  chat: Chat
  onClose?: () => void
}

export default function ChatHeader({ chat, onClose }: ChatHeaderProps) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [showGroupCallModal, setShowGroupCallModal] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [groupParticipants, setGroupParticipants] = useState<any[]>([])
  const [groupData, setGroupData] = useState<any>(null)
  const [loadingParticipants, setLoadingParticipants] = useState(false)

  const { startCall } = useCall()
  const isOnline = usePresenceStore(state => state.isOnline(chat.otherUserId))
  const [callTypeForGroup, setCallTypeForGroup] = useState<'voice' | 'video'>('voice')

  // Para chamada privada
  const handlePrivateCall = async (type: 'voice' | 'video') => {
    if (chat.type === 'private' && chat.participants && chat.participants[0]) {
      await startCall(chat.id, type, chat.participants[0].id)
    }
  }

  // Para chamada em grupo - abrir modal para selecionar participantes
  const handleGroupCall = async (type: 'voice' | 'video') => {
    if (chat.type === 'group') {
      await loadGroupParticipants()
      setCallTypeForGroup(type)
      setShowGroupCallModal(true)
    }
    setShowMenu(false)
  }

  const loadGroupParticipants = async () => {
  setLoadingParticipants(true)
  try {
    // 1. Procura o grupo associado ao chat
    const groupResponse = await api.get(`/groups/by-chat/${chat.id}`)
    const group = groupResponse.data
    setGroupData(group)
    
    // 2. 🔥 CHAMADA CORRIGIDA: Usa os detalhes completos que já vêm mapeados em camelCase com userId
    const detailsResponse = await api.get(`/groups/${group.id}`)
    const members = detailsResponse.data.members || []
    
    // 3. Filtra o usuário atual logado
    const currentUserId = localStorage.getItem('userId')
    const otherMembers = members.filter((m: any) => m.userId !== currentUserId)
    
    setGroupParticipants(otherMembers)
  } catch (error) {
    console.error('Error loading group participants:', error)
    toast.error('Erro ao carregar participantes do grupo')
  } finally {
    setLoadingParticipants(false)
  }
}

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllParticipants = () => {
    if (selectedParticipants.length === groupParticipants.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(groupParticipants.map((p: any) => p.userId || p.id))
    }
  }

  const startGroupCall = async () => {
  if (selectedParticipants.length === 0) {
    toast.error('Selecione pelo menos um participante para a chamada')
    return
  }

  // Captura o primeiro participante selecionado para satisfazer a validação do Backend (receiverId)
  const firstParticipantId = selectedParticipants[0]
  
  try {
    // 1. 🔥 Enviamos exatamente o que a validação do teu Backend exige para não dar 400
    // No ChatHeader.tsx, altera temporariamente para testar:
// No ChatHeader.tsx, substitui o axios.post temporário por este:
// No ChatHeader.tsx -> Dentro de startGroupCall()
const response = await api.post('/calls/start', { 
  chatId: chat.id, 
  type: callTypeForGroup, 
  receiverId: firstParticipantId 
})

    
    const call = response.data
    
    // Geramos o link apontando para a sala multijanelas de grupo
    const meetingLink = `${window.location.origin}/group-call/${chat.id}?type=${callTypeForGroup}`

    // 2. Posta o link da reunião no grupo de forma assíncrona
    try {
      const formData = new FormData()
      formData.append('content', `📅 **Nova Reunião Iniciada!**\nClique no link para entrar na sala multijanelas:\n${meetingLink}`)
      formData.append('chatId', chat.id)

      await api.post('/chats/messages', formData)
    } catch (msgError) {
      console.error('Erro ao postar link da reunião no grupo:', msgError)
    }

    // 3. Emite o sinal via WebSockets para fazer tocar no ecrã de cada participante selecionado
    selectedParticipants.forEach((participantId) => {
      socket.emit('group_call_invite', {
        callId: call.id,
        chatId: chat.id,
        receiverId: participantId,
        callerId: localStorage.getItem('userId'),
        type: callTypeForGroup,
      })
    })

    // Limpa os estados do modal
    setShowGroupCallModal(false)
    setSelectedParticipants([])
    
    // 4. Redireciona o criador para a sala de vídeo em grupo
    navigate(`/group-call/${chat.id}?type=${callTypeForGroup}`)
    toast.success('Reunião criada! O link foi enviado no chat.')
  } catch (error: any) {
    console.error('Error starting group call:', error)
    
    // Dica extra: Se ainda der erro, isto vai printar no teu console o campo exato que falhou
    if (error.response?.data) {
      console.log('Detalhes do erro do Backend:', error.response.data)
    }
    
    toast.error('Erro ao iniciar chamada em grupo no servidor')
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

      {/* Modal para selecionar participantes da chamada em grupo */}
      <Modal
        isOpen={showGroupCallModal}
        onClose={() => {
          setShowGroupCallModal(false)
          setSelectedParticipants([])
        }}
        title={`Chamada de ${callTypeForGroup === 'video' ? 'Vídeo' : 'Voz'} em Grupo`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Selecione os participantes para a chamada
            </p>
            <button
              onClick={selectAllParticipants}
              className="text-sm text-whatsapp-green hover:underline"
            >
              {selectedParticipants.length === groupParticipants.length ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
          </div>

          {loadingParticipants ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {groupParticipants.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum outro participante no grupo
                </p>
              ) : (
                // Dentro do return do Modal:
groupParticipants.map((participant) => (
  <label
    key={participant.userId} // ◀️ Agora vai receber o UUID correto (Ex: 1cc1541e...)
    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
  >
    <div className="flex items-center gap-3">
      <Avatar name={participant.userName} avatarUrl={participant.userAvatar} size="md" />
      <div>
        <p className="font-medium">{participant.userName}</p>
        <p className="text-xs text-gray-500">
          {participant.isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
    <input
      type="checkbox"
      checked={selectedParticipants.includes(participant.userId)}
      onChange={() => toggleParticipant(participant.userId)}
      className="w-5 h-5 rounded text-whatsapp-green focus:ring-whatsapp-green"
    />
  </label>
))
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowGroupCallModal(false)
                setSelectedParticipants([])
              }}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              onClick={startGroupCall}
              disabled={selectedParticipants.length === 0}
              fullWidth
            >
              <Phone size={16} className="mr-2" />
              Iniciar Chamada ({selectedParticipants.length})
            </Button>
          </div>
        </div>
      </Modal>

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