import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Group, Plus, Users, Search, MessageCircle, Info } from 'lucide-react'
import Header from '../components/layout/Header'
import Avatar from '../components/common/Avatar'
import Skeleton from '../components/common/Skeleton'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Input } from '../components/common/Input'
import ChatWindow from '../components/chat/ChatWindow'
import GroupInfo from '../components/group/GroupInfo'
import api from '../services/api'
import { Group as GroupType } from '../types/group.types'
import { Chat } from '../types/chat.types'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function Groups() {
  const [groups, setGroups] = useState<GroupType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showGroupInfo, setShowGroupInfo] = useState(false)
  const [selectedGroupInfo, setSelectedGroupInfo] = useState<any>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const response = await api.get('/groups')
      console.log('Groups loaded:', response.data)
      setGroups(response.data)
    } catch (error) {
      console.error('Error loading groups:', error)
      toast.error('Erro ao carregar grupos')
    } finally {
      setLoading(false)
    }
  }

  const handleGroupClick = async (group: GroupType) => {
    console.log('Group clicked:', group)

    try {
      toast.loading('Abrindo grupo...', { id: 'opening-group' })

      // Buscar detalhes completos do grupo
      const response = await api.get(`/groups/${group.id}`)
      const groupDetails = response.data

      console.log('Group details:', groupDetails)

      // Criar objeto chat para o grupo
      const chat: Chat = {
  id: groupDetails.chat_id, // ✅ CORRETO
  type: 'group',
  name: group.name,
  avatarUrl: group.avatarUrl,
  participants: groupDetails.members || [],
  unreadCount: 0,
  createdAt: new Date(group.createdAt),
}



      setSelectedGroup(group)
      setSelectedChat(chat)
      setIsChatOpen(true)

      toast.success(`Grupo ${group.name} aberto`, { id: 'opening-group' })
    } catch (error) {
      console.error('Error opening group:', error)
      toast.error('Erro ao abrir grupo', { id: 'opening-group' })
    }
  }

  const handleViewGroupInfo = async (group: GroupType, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Viewing group info:', group)

    try {
      const response = await api.get(`/groups/${group.id}`)
      console.log('Group info loaded:', response.data)
      setSelectedGroupInfo(response.data)
      setShowGroupInfo(true)
    } catch (error) {
      console.error('Error loading group info:', error)
      toast.error('Erro ao carregar informações do grupo')
    }
  }

  const handleAddMembers = async (userIds: string[]) => {
    try {
      await api.post(`/groups/${selectedGroupInfo.id}/members`, { userIds })
      toast.success('Membros adicionados com sucesso!')
      // Recarregar informações do grupo
      const response = await api.get(`/groups/${selectedGroupInfo.id}`)
      setSelectedGroupInfo(response.data)
      await fetchGroups()
    } catch (error) {
      console.error('Error adding members:', error)
      toast.error('Erro ao adicionar membros')
      throw error
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/groups/${selectedGroupInfo.id}/members/${userId}`)
      toast.success('Membro removido com sucesso')
      const response = await api.get(`/groups/${selectedGroupInfo.id}`)
      setSelectedGroupInfo(response.data)
      await fetchGroups()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Erro ao remover membro')
      throw error
    }
  }

  const handleUpdateGroup = async (data: Partial<GroupType>) => {
    try {
      await api.put(`/groups/${selectedGroupInfo.id}`, data)
      toast.success('Grupo atualizado com sucesso')
      const response = await api.get(`/groups/${selectedGroupInfo.id}`)
      setSelectedGroupInfo(response.data)
      await fetchGroups()
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Erro ao atualizar grupo')
    }
  }

  const handleCloseChat = () => {
    setIsChatOpen(false)
    setSelectedGroup(null)
    setSelectedChat(null)
  }

  const createGroup = async () => {
    if (!newGroupName) {
      toast.error('Nome do grupo é obrigatório')
      return
    }

    try {
      const response = await api.post('/groups', {
        name: newGroupName,
        description: newGroupDescription,
        participants: [],
      })

      console.log('Group created:', response.data)
      setGroups([response.data.group, ...groups])
      toast.success('Grupo criado com sucesso!')
      setIsCreateModalOpen(false)
      setNewGroupName('')
      setNewGroupDescription('')
      await fetchGroups()
    } catch (error) {
      console.error('Error creating group:', error)
      toast.error('Erro ao criar grupo')
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-full">
        <Header title="Grupos" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton variant="circular" width={56} height={56} />
              <div className="flex-1">
                <Skeleton width="60%" height={20} className="mb-2" />
                <Skeleton width="80%" height={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isChatOpen && selectedChat) {
    return (
      <div className="h-full">
        <ChatWindow chat={selectedChat} onClose={handleCloseChat} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Header
        title="Grupos"
        onSearch={setSearchQuery}
        actions={
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} className="mr-1" />
            Novo Grupo
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4">
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <Group size={64} strokeWidth={1} />
            <p className="mt-4 text-lg">Nenhum grupo encontrado</p>
            <p className="text-sm">Crie um grupo para começar a conversar com várias pessoas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleGroupClick(group)}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Avatar name={group.name} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{group.name}</h3>
                    <button
                      onClick={(e) => handleViewGroupInfo(group, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                      title="Informações do grupo"
                    >
                      <Info size={16} className="text-gray-400" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-1">
                    {group.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {group.memberCount || group.members?.length || 0} membros
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleGroupClick(group)}
                  className="p-2 bg-whatsapp-green text-white rounded-full hover:bg-whatsapp-dark transition-colors"
                  title="Abrir conversa"
                >
                  <MessageCircle size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de criação de grupo */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Criar Novo Grupo"
      >
        <div className="space-y-4">
          <Input
            label="Nome do grupo *"
            placeholder="Ex: Amigos, Família, Trabalho"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            autoFocus
          />

          <Input
            label="Descrição"
            placeholder="O que este grupo é sobre?"
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
          />

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 Dica: Você pode adicionar membros depois de criar o grupo
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} fullWidth>
              Cancelar
            </Button>
            <Button onClick={createGroup} fullWidth>
              Criar Grupo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de informações do grupo */}
      {showGroupInfo && selectedGroupInfo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <GroupInfo
              group={selectedGroupInfo}
              chatId={selectedGroupInfo.chatId}
              currentUserId={user?.id || ''}
              onUpdate={handleUpdateGroup}
              onAddMembers={handleAddMembers}
              onRemoveMember={handleRemoveMember}
              onClose={() => setShowGroupInfo(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}