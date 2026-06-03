import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, PhoneCall, Video, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/layout/Header'
import Avatar from '../components/common/Avatar'
import Skeleton from '../components/common/Skeleton'
import api from '../services/api'
//import { format, formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import toast from 'react-hot-toast'
// Altera o import existente para incluir o parseISO
import { format, formatDistanceToNow, parseISO } from 'date-fns'

interface CallHistoryItem {
  id: string
  contactId: string
  contactName: string
  contactAvatar?: string
  type: 'voice' | 'video'
  status: 'missed' | 'received' | 'outgoing'
  duration: number
  createdAt: Date
}

export default function CallHistory() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<CallHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await api.get('/calls/history/all')
      setHistory(response.data)
    } catch (error) {
      toast.error('Erro ao carregar histórico')
    } finally {
      setLoading(false)
    }
  }

  const groupByDate = () => {
    const groups: { [key: string]: CallHistoryItem[] } = {}
    
    history.forEach(call => {
      // Se por algum motivo o createdAt falhar ou vier vazio, evita crashar a aplicação
      if (!call.createdAt) return 

      // Converte a string ISO da API de forma segura para um objeto Date
      const parsedDate = typeof call.createdAt === 'string' ? parseISO(call.createdAt) : new Date(call.createdAt)
      
      const dateKey = format(parsedDate, 'yyyy-MM-dd')
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(call)
    })
    return groups
  }

  const getDurationText = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const groupedHistory = groupByDate()

  if (loading) {
    return (
      <div className="h-full">
        <Header title="Histórico de Chamadas" />
        <div className="p-4 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton width="30%" height={20} className="mb-3" />
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-3 p-3 mb-2">
                  <Skeleton variant="circular" width={48} height={48} />
                  <div className="flex-1">
                    <Skeleton width="50%" height={20} className="mb-2" />
                    <Skeleton width="30%" height={16} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-whatsapp-header-dark border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Histórico de Chamadas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Todas as chamadas realizadas, recebidas e perdidas</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <PhoneCall size={64} strokeWidth={1} />
            <p className="mt-4 text-lg">Nenhum histórico encontrado</p>
            <p className="text-sm">Suas chamadas aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, calls]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={16} className="text-gray-400" />
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                    {format(new Date(date), "EEEE, d 'de' MMMM", { locale: pt })}
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {calls.map((call, index) => (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm ${
                        call.status === 'missed' ? 'bg-red-50 dark:bg-red-900/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={call.contactName} avatarUrl={call.contactAvatar} size="md" />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{call.contactName}</h4>
                          <div className="flex items-center gap-2 text-sm">
                            {call.type === 'voice' ? <PhoneCall size={14} /> : <Video size={14} />}
                            <span className={call.status === 'missed' ? 'text-red-500' : 'text-gray-500'}>
                              {call.status === 'outgoing' ? 'Efectuada' : call.status === 'received' ? 'Recebida' : 'Perdida'}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{getDurationText(call.duration)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
  <p className="text-sm text-gray-500">
    {/* 🔥 Atualizado para converter string com segurança */}
    {format(typeof call.createdAt === 'string' ? parseISO(call.createdAt) : new Date(call.createdAt), 'HH:mm')}
  </p>
  <p className="text-xs text-gray-400">
    {/* 🔥 Atualizado para converter string com segurança */}
    {formatDistanceToNow(typeof call.createdAt === 'string' ? parseISO(call.createdAt) : new Date(call.createdAt), { addSuffix: true, locale: pt })}
  </p>
</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}