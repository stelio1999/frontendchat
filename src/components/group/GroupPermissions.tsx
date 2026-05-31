import React, { useState, useEffect } from 'react'
import { 
  Camera, Users, Shield, Settings, UserMinus, UserPlus, 
  Edit2, Trash2, Bell, Lock, Hash, Calendar, Video,
  Crown, MessageCircle, Image, Link as LinkIcon
} from 'lucide-react'
import Avatar from '../common/Avatar'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { Input } from '../components/common/Input'
import { Group, GroupMember, Permissions } from '../../types/group.types'
import { User } from '../../types/user.types'
import api from '../../services/api'
import toast from 'react-hot-toast'
import AddMembers from './AddMembers'
import GroupPermissions from './GroupPermissions'
import ScheduleMeeting from './ScheduleMeeting'

interface GroupInfoProps {
  group: Group
  chatId: string
  currentUserId: string
  onUpdate: () => void
  onClose: () => void
}

export default function GroupInfo({ group, chatId, currentUserId, onUpdate, onClose }: GroupInfoProps) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [groupName, setGroupName] = useState(group.name)
  const [groupDescription, setGroupDescription] = useState(group.description || '')
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    loadMembers()
    checkIfAdmin()
  }, [group.id])

  const loadMembers = async () => {
    try {
      const response = await api.get(`/groups/${group.id}/members`)
      setMembers(response.data)
    } catch (error) {
      console.error('Error loading members:', error)
      toast.error('Erro ao carregar membros')
    } finally {
      setLoading(false)
    }
  }

  const checkIfAdmin = () => {
    const currentMember = members.find(m => m.userId === currentUserId)
    setIsAdmin(currentMember?.role === 'admin')
  }

  const handleUpdateGroup = async () => {
    try {
      await api.put(`/groups/${group.id}`, {
        name: groupName,
        description: groupDescription,
      })
      toast.success('Grupo atualizado com sucesso!')
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating group:', error)
      toast.error('Erro ao atualizar grupo')
    }
  }

  const handleAddMembers = async (userIds: string[]) => {
    try {
      await api.post(`/groups/${group.id}/members`, { userIds })
      toast.success('Membros adicionados com sucesso!')
      setIsAddMemberModalOpen(false)
      loadMembers()
      onUpdate()
    } catch (error) {
      console.error('Error adding members:', error)
      toast.error('Erro ao adicionar membros')
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (window.confirm(`Deseja remover ${userName} do grupo?`)) {
      try {
        await api.delete(`/groups/${group.id}/members/${userId}`)
        toast.success(`${userName} removido do grupo`)
        loadMembers()
        onUpdate()
      } catch (error) {
        console.error('Error removing member:', error)
        toast.error('Erro ao remover membro')
      }
    }
  }

  const handleUpdateRole = async (userId: string, role: 'admin' | 'member') => {
    try {
      await api.put(`/groups/${group.id}/members/${userId}/role`, { role })
      toast.success(`Cargo atualizado com sucesso`)
      loadMembers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('Erro ao atualizar cargo')
    }
  }

  const handleUpdatePermissions = async (permissions: Permissions) => {
    try {
      await api.put(`/groups/${group.id}/permissions`, { permissions })
      toast.success('Permissões atualizadas com sucesso')
      setIsPermissionsModalOpen(false)
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Erro ao atualizar permissões')
    }
  }

  const handleScheduleMeeting = async (meetingData: any) => {
    try {
      await api.post('/meetings/schedule', {
        ...meetingData,
        groupId: group.id,
        chatId,
      })
      toast.success('Reunião agendada com sucesso!')
      setIsScheduleModalOpen(false)
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      toast.error('Erro ao agendar reunião')
    }
  }

  const handleLeaveGroup = async () => {
    if (window.confirm('Tem certeza que deseja sair do grupo?')) {
      try {
        await api.post(`/groups/${group.id}/leave`)
        toast.success('Você saiu do grupo')
        onClose()
      } catch (error) {
        console.error('Error leaving group:', error)
        toast.error('Erro ao sair do grupo')
      }
    }
  }

  const handleDeleteGroup = async () => {
    if (window.confirm('Tem certeza que deseja excluir o grupo? Esta ação não pode ser desfeita.')) {
      try {
        await api.delete(`/groups/${group.id}`)
        toast.success('Grupo excluído com sucesso')
        onClose()
      } catch (error) {
        console.error('Error deleting group:', error)
        toast.error('Erro ao excluir grupo')
      }
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Informações do Grupo
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            ✕
          </button>
        </div>
      </div>

      {/* Group Avatar */}
      <div className="relative p-6 text-center border-b border-gray-200 dark:border-gray-700">
        <div className="relative inline-block">
          <Avatar name={group.name} size="xl" />
          {isAdmin && (
            <button className="absolute bottom-0 right-0 p-1.5 bg-whatsapp-green rounded-full text-white">
              <Camera size={14} />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="mt-4 space-y-3">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Nome do grupo"
            />
            <Input
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Descrição do grupo"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={handleUpdateGroup}>Salvar</Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{group.name}</h3>
            {group.description && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">{group.description}</p>
            )}
            {isAdmin && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-sm text-whatsapp-green hover:underline"
              >
                Editar informações
              </button>
            )}
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
          <p className="text-xs text-gray-500">Membros</p>
        </div>
        <div className="text-center">
          <Calendar className="w-5 h-5 mx-auto text-gray-400 mb-1" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {new Date(group.createdAt).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">Criado em</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-500 mb-3">Ações</h4>
        <div className="space-y-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <UserPlus size={20} className="text-whatsapp-green" />
                <span>Adicionar membros</span>
              </button>
              <button
                onClick={() => setIsPermissionsModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Shield size={20} className="text-whatsapp-green" />
                <span>Permissões do grupo</span>
              </button>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Calendar size={20} className="text-whatsapp-green" />
                <span>Agendar reunião</span>
              </button>
            </>
          )}
          <button
            onClick={handleLeaveGroup}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
          >
            <LogOut size={20} />
            <span>Sair do grupo</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleDeleteGroup}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            >
              <Trash2 size={20} />
              <span>Excluir grupo</span>
            </button>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-sm font-semibold text-gray-500">Membros</h4>
          <p className="text-sm text-gray-500">{members.length} participantes</p>
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                <Avatar name={member.userName} size="md" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{member.userName}</p>
                  <div className="flex items-center gap-1">
                    {member.role === 'admin' && (
                      <Crown size={12} className="text-yellow-500" />
                    )}
                    <p className="text-xs text-gray-500">
                      {member.role === 'admin' ? 'Administrador' : 'Membro'}
                    </p>
                  </div>
                </div>
              </div>
              {isAdmin && member.userId !== currentUserId && (
                <div className="flex items-center gap-1">
                  {member.role !== 'admin' ? (
                    <button
                      onClick={() => handleUpdateRole(member.userId, 'admin')}
                      className="p-1 text-whatsapp-green hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Tornar admin"
                    >
                      <Crown size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateRole(member.userId, 'member')}
                      className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      title="Remover admin"
                    >
                      <UserMinus size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMember(member.userId, member.userName)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="Remover membro"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Adicionar Membros"
        size="lg"
      >
        <AddMembers
          groupId={group.id}
          onAdd={handleAddMembers}
          onClose={() => setIsAddMemberModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title="Permissões do Grupo"
      >
        <GroupPermissions
          permissions={group.settings || {}}
          onUpdate={handleUpdatePermissions}
        />
      </Modal>

      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Agendar Reunião"
        size="lg"
      >
        <ScheduleMeeting
          groupId={group.id}
          members={members}
          onSchedule={handleScheduleMeeting}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      </Modal>
    </div>
  )
}