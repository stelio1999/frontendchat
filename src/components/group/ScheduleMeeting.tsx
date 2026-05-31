import React, { useState } from 'react'
import { Calendar, Clock, Users, Video, Bell, X } from 'lucide-react'
import Button from '../common/Button'
import { Input } from '../common/Input'
import Avatar from '../common/Avatar'
import toast from 'react-hot-toast'

interface Member {
  userId: string
  userName: string
  userAvatar?: string
}

interface ScheduleMeetingProps {
  groupId: string
  members: Member[]
  onSchedule: (meetingData: any) => void
  onClose: () => void
}

export default function ScheduleMeeting({ groupId, members, onSchedule, onClose }: ScheduleMeetingProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [notifyParticipants, setNotifyParticipants] = useState(true)

  const handleSubmit = () => {
    if (!title) {
      toast.error('Título da reunião é obrigatório')
      return
    }
    if (!date || !time) {
      toast.error('Data e hora são obrigatórias')
      return
    }

    const scheduledFor = new Date(`${date}T${time}`)
    if (scheduledFor < new Date()) {
      toast.error('A data deve ser no futuro')
      return
    }

    onSchedule({
      title,
      description,
      scheduledFor,
      duration: parseInt(duration),
      participants: selectedParticipants,
      notifyParticipants,
    })
  }

  const toggleAllParticipants = () => {
    if (selectedParticipants.length === members.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(members.map(m => m.userId))
    }
  }

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0]
  // Get min time (current time + 1 hour)
  const now = new Date()
  now.setHours(now.getHours() + 1)
  const minTime = now.toTimeString().slice(0, 5)

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          📅 Agende uma reunião com os membros do grupo. A reunião será criada e todos os participantes selecionados serão notificados.
        </p>
      </div>

      <Input
        label="Título da reunião *"
        placeholder="Ex: Reunião semanal, Alinhamento do projeto..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Input
        label="Descrição (opcional)"
        placeholder="Descreva o assunto da reunião..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Data *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hora *</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            min={date === today ? minTime : undefined}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Duração (minutos)</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
        >
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="45">45 minutos</option>
          <option value="60">1 hora</option>
          <option value="90">1 hora e 30 minutos</option>
          <option value="120">2 horas</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Participantes</label>
          <button
            onClick={toggleAllParticipants}
            className="text-xs text-whatsapp-green hover:underline"
          >
            {selectedParticipants.length === members.length ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
          {members.map((member) => (
            <label
              key={member.userId}
              className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedParticipants.includes(member.userId)}
                  onChange={() => toggleParticipant(member.userId)}
                  className="rounded text-whatsapp-green focus:ring-whatsapp-green"
                />
                <Avatar name={member.userName} size="sm" />
                <span className="text-sm">{member.userName}</span>
              </div>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {selectedParticipants.length} de {members.length} participantes selecionados
        </p>
      </div>

      <label className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-500" />
          <span className="text-sm">Notificar participantes</span>
        </div>
        <input
          type="checkbox"
          checked={notifyParticipants}
          onChange={(e) => setNotifyParticipants(e.target.checked)}
          className="rounded text-whatsapp-green focus:ring-whatsapp-green"
        />
      </label>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onClose} fullWidth>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} fullWidth>
          <Video size={16} className="mr-1" />
          Agendar Reunião
        </Button>
      </div>
    </div>
  )
}