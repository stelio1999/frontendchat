import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Phone, Video, PhoneCall, PhoneMissed, PhoneIncoming, PhoneOutgoing } from 'lucide-react'
import Header from '../components/layout/Header'
import Avatar from '../components/common/Avatar'
import Skeleton from '../components/common/Skeleton'
import Button from '../components/common/Button'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Call {
  id: string
  contactId: string
  contactName: string
  contactAvatar?: string
  type: 'voice' | 'video'
  status: 'missed' | 'received' | 'outgoing'
  duration?: number
  createdAt: Date
}

export default function Calls() {
  const navigate = useNavigate()
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'missed'>('all')
const safeDate = (date: any) => {
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d
}
  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      const response = await api.get('/calls/history')
      setCalls(response.data)
    } catch (error) {
      toast.error('Erro ao carregar histórico de chamadas')
    } finally {
      setLoading(false)
    }
  }

  const startCall = (contactId: string, type: 'voice' | 'video') => {
    navigate(`/call/${contactId}?type=${type}`)
  }

  const getCallIcon = (status: string, type: string) => {
    if (status === 'missed') return <PhoneMissed size={18} className="text-red-500" />
    if (status === 'outgoing') return <PhoneOutgoing size={18} className="text-green-500" />
    return <PhoneIncoming size={18} className="text-whatsapp-green" />
  }

  const getStatusText = (status: string, duration?: number) => {
    if (status === 'missed') return 'Perdida'
    if (status === 'outgoing') return 'Efectuada'
    if (duration) return `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
    return 'Recebida'
  }

  const filteredCalls = calls.filter(call => 
    filter === 'all' || call.status === 'missed'
  )

  if (loading) {
    return (
      <div className="h-full">
        <Header title="Chamadas" />
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1">
                <Skeleton width="50%" height={20} className="mb-2" />
                <Skeleton width="30%" height={16} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <Header 
        title="Chamadas" 
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'all' 
                  ? 'bg-whatsapp-green text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('missed')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === 'missed' 
                  ? 'bg-whatsapp-green text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Perdidas
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-4">
        {filteredCalls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <PhoneCall size={64} strokeWidth={1} />
            <p className="mt-4 text-lg">Nenhuma chamada encontrada</p>
            <p className="text-sm">Faça sua primeira chamada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCalls.map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm ${
                  call.status === 'missed' ? 'border-l-4 border-red-500' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={call.contactName} avatarUrl={call.contactAvatar} size="lg" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{call.contactName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getCallIcon(call.status, call.type)}
                      <span className="text-sm text-gray-500">
                        {getStatusText(call.status, call.duration)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {call.createdAt && safeDate(call.createdAt)
  ? formatDistanceToNow(safeDate(call.createdAt)!, {
      addSuffix: true,
      locale: pt,
    })
  : 'Data inválida'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startCall(call.contactId, 'voice')}
                  >
                    <Phone size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startCall(call.contactId, 'video')}
                  >
                    <Video size={16} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}