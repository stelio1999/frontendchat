import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, FileText, ArrowLeft, Download, RefreshCw, Eye, ListVideo } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import api from '../services/api'
import toast from 'react-hot-toast'

interface MeetingFile {
  fileName: string
  time: string
}

export default function PostMeetingPanel() {
  const navigate = useNavigate()
  
  const getTodayDateString = () => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  const [date, setDate] = useState(getTodayDateString())
  const [meetingFiles, setMeetingFiles] = useState<MeetingFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [option, setOption] = useState('resumo')
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)

  // Dispara a busca sempre que a data mudar
  useEffect(() => {
    if (date) {
      fetchAvailableFiles()
    }
  }, [date])

  const fetchAvailableFiles = async () => {
    setLoadingFiles(true)
    setSelectedFile('')
    setMeetingFiles([])
    try {
      // Faz o GET chamando a nova rota com a query string ?date=YYYY-MM-DD
      const response = await api.get(`/calls/meetings/list-by-date?date=${date}`)
      setMeetingFiles(response.data)
      if (response.data.length > 0) {
        setSelectedFile(response.data[0].fileName) // Seleciona o primeiro por padrão
      }
    } catch (err) {
      toast.error('Erro ao listar reuniões desta data.')
    } finally {
      setLoadingFiles(false)
    }
  }

  const handleGenerateAndPreview = async () => {
    if (!selectedFile) return toast.error('Por favor, seleciona uma reunião da lista.')
    setLoadingAI(true)
    setPreviewContent(null)

    try {
      const response = await api.post('/calls/generate-doc', {
        fileName: selectedFile, // Enviando o arquivo .txt específico escolhido
        option
      })

      if (!response.data.markdownContent) throw new Error('Sem conteúdo')

      setPreviewContent(response.data.markdownContent)
      toast.success('Documento processado pelo Gemini!')
    } catch (err) {
      toast.error('Erro ao processar este arquivo com a IA.')
    } finally {
      setLoadingAI(false)
    }
  }

  const handleDownload = (format: 'pdf' | 'word') => {
    if (!previewContent) return

    if (format === 'pdf') {
      const doc = new jsPDF()
      const splitText = doc.splitTextToSize(previewContent, 180)
      doc.text(splitText, 10, 20)
      doc.save(`${selectedFile.replace('.txt', '')}_${option}.pdf`)
    } else {
      const blob = new Blob(['\ufeff' + previewContent], { type: 'application/msword;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${selectedFile.replace('.txt', '')}_${option}.doc`
      link.click()
      URL.revokeObjectURL(url)
    }
    toast.success('Ficheiro baixado!')
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-whatsapp-chat-dark">
      <div className="bg-white dark:bg-whatsapp-header-dark border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-700 dark:text-gray-300">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Painel Pós-Reunião</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Selecione e processe reuniões específicas com Inteligência Artificial</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Painel Lateral de Filtros */}
        <div className="md:col-span-1 bg-white dark:bg-whatsapp-sidebar-dark p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <FileText className="text-whatsapp-green" size={20} />
            <h2 className="font-semibold text-gray-900 dark:text-white">Filtros de Reunião</h2>
          </div>

          {/* 1. Seleção da Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1. Escolha a Data:</label>
            <input 
              type="date" 
              className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none"
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>

          {/* 2. Lista de Arquivos Gerados naquele Dia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">2. Selecione a Reunião do Dia:</label>
            {loadingFiles ? (
              <p className="text-xs text-gray-400 animate-pulse">A carregar arquivos do servidor...</p>
            ) : meetingFiles.length === 0 ? (
              <p className="text-xs text-red-500 font-medium">Nenhuma reunião gravada nesta data.</p>
            ) : (
              <select 
                className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none"
                value={selectedFile} 
                onChange={(e) => setSelectedFile(e.target.value)}
              >
                {meetingFiles.map((file) => (
                  <option key={file.fileName} value={file.fileName}>
                    Reunião das {file.time} ({file.fileName.substring(23)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Opção de Inteligência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">3. Operação da IA:</label>
            <select 
              className="w-full p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none"
              value={option} 
              onChange={(e) => setOption(e.target.value)}
            >
              <option value="resumo">Criar Resumo Executivo</option>
              <option value="acta">Montar Acta Formal</option>
              <option value="relatorio">Gerar Relatório Detalhado</option>
              <option value="coerencia">Corrigir e Unificar Texto</option>
            </select>
          </div>

          <button 
            onClick={handleGenerateAndPreview}
            disabled={loadingAI || !selectedFile}
            className="w-full bg-whatsapp-green hover:bg-whatsapp-dark text-white p-3 rounded-lg font-semibold shadow flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loadingAI ? <RefreshCw className="animate-spin" size={18} /> : <Eye size={18} />}
            {loadingAI ? 'Gemini a processar...' : 'Processar Reunião'}
          </button>
        </div>

        {/* Preview do Documento */}
        <div className="md:col-span-2 flex flex-col bg-white dark:bg-whatsapp-sidebar-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[450px]">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Resultado da IA</span>
            {previewContent && (
              <div className="flex gap-2">
                <button onClick={() => handleDownload('pdf')} className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold flex items-center gap-1"><Download size={14} /> PDF</button>
                <button onClick={() => handleDownload('word')} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold flex items-center gap-1"><Download size={14} /> Word</button>
              </div>
            )}
          </div>

          <div className="flex-1 p-5 overflow-y-auto font-mono text-sm">
            {previewContent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{previewContent}</motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-center p-8">
                <ListVideo size={48} strokeWidth={1} className="mb-2 text-gray-300" />
                <p className="font-medium">Nenhum arquivo processado</p>
                <p className="text-xs max-w-xs mt-1">Selecione o horário da reunião na lista lateral para carregar a transcrição correspondente.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}