import React, { useState, useEffect } from 'react'
import { Camera, Users, Shield, Settings, UserMinus, UserPlus, X, ChevronRight } from 'lucide-react'
import Avatar from '../common/Avatar'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { Input } from '../common/Input'
import { Group, GroupMember } from '../../types/group.types'
import AddMembers from './AddMembers'
import toast from 'react-hot-toast'
import api from '../../services/api'

interface GroupInfoProps {
  group: Group
  chatId: string
  
  currentUserId: string
  onUpdate: (data: Partial<Group>) => void
  onAddMembers: (userIds: string[]) => void
  onRemoveMember: (userId: string) => void
  onClose?: () => void
}

export default function GroupInfo({ 
  group, 
  chatId,
  currentUserId,
  onUpdate, 
  onAddMembers, 
  onRemoveMember,
  onClose 
}: GroupInfoProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [groupName, setGroupName] = useState(group.name)
  const [groupDescription, setGroupDescription] = useState(group.description || '')
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(true)
  
  // Buscar membros atualizados
  useEffect(() => {
    loadMembers()
  }, [group.id])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/groups/${group.id}/members`)
      console.log('Group members loaded:', response.data)
      setMembers(response.data)
    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  // Verificar se é admin baseado nos membros carregados
  const isAdmin = members.some(m => m.userId === currentUserId && m.role === 'admin')
  console.log('Is admin:', isAdmin, 'Current user:', currentUserId, 'Members:', members)

  const handleSave = () => {
    onUpdate({ name: groupName, description: groupDescription })
    setIsEditing(false)
    toast.success('Informações do grupo atualizadas')
  }

  const handleAddMembersClick = () => {
    console.log('Add members button clicked')
    setIsAddMemberModalOpen(true)
  }

  const handleAddMembers = async (userIds: string[]) => {
    console.log('Adding members:', userIds)
    try {
      await onAddMembers(userIds)
      setIsAddMemberModalOpen(false)
      await loadMembers() // Recarregar membros
      toast.success('Membros adicionados com sucesso!')
    } catch (error) {
      console.error('Error adding members:', error)
      toast.error('Erro ao adicionar membros')
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (window.confirm(`Deseja remover ${userName} do grupo?`)) {
      try {
        await onRemoveMember(userId)
        await loadMembers() // Recarregar membros
        toast.success(`${userName} removido do grupo`)
      } catch (error) {
        console.error('Error removing member:', error)
        toast.error('Erro ao remover membro')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg">
        {/* Header com botão fechar */}
        <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Group Header */}
        <div className="relative">
          <div className="h-32 bg-whatsapp-green/20 rounded-t-lg" />
          <div className="absolute -bottom-12 left-4">
            <div className="relative">
              <Avatar name={group.name} size="xl" />
              {isAdmin && (
                <button className="absolute bottom-0 right-0 p-1 bg-whatsapp-green rounded-full text-white">
                  <Camera size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Group Info */}
        <div className="pt-16 p-4">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nome do grupo"
              />
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                placeholder="Descrição do grupo"
                rows={2}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
                  {group.description && (
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Settings size={20} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Members Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Membros ({members.length})
              </h3>
            </div>
            {/* Botão sempre visível para teste - REMOVER DEPOIS */}
            <Button 
              size="sm" 
              onClick={handleAddMembersClick}
              className="bg-whatsapp-green text-white hover:bg-whatsapp-dark"
            >
              <UserPlus size={16} className="mr-1" />
              Adicionar
            </Button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {members.map((member) => (
              <div key={member.userId} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar name={member.userName} size="md" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {member.userName}
                      {member.userId === currentUserId && (
                        <span className="ml-2 text-xs text-gray-400">(você)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.role === 'admin' ? '👑 Administrador' : '👤 Membro'}
                    </p>
                  </div>
                </div>
                {isAdmin && member.userId !== currentUserId && (
                  <button
                    onClick={() => handleRemoveMember(member.userId, member.userName)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <UserMinus size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para adicionar membros */}
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
    </>
  )
}