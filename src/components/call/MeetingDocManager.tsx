import React, { useState } from 'react'
import { jsPDF } from 'jspdf' // npm install jspdf

export const MeetingDocManager: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [date, setDate] = useState('')
  const [option, setOption] = useState('resumo')
  const [loading, setLoading] = useState(false)

  const handleDownload = async (format: 'pdf' | 'word') => {
    if (!date) return alert('Por favor, escolhe uma data para a reunião.')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/calls/generate-doc', { // Ajusta para a URL do teu backend
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, date, option })
      })
      const data = await response.json()

      if (!data.markdownContent) throw new Error('Sem conteúdo retornado')

      const content = data.markdownContent

      if (format === 'pdf') {
        const doc = new jsPDF()
        const splitText = doc.splitTextToSize(content, 180)
        doc.text(splitText, 10, 20)
        doc.save(`Reuniao_${date}_${option}.pdf`)
      } else {
        // Converte em Blob interpretável nativamente como documento do Word (.doc)
        const blob = new Blob(['\ufeff' + content], { type: 'application/msword;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Reuniao_${date}_${option}.doc`
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao gerar documento. Verifica se a transcrição existe para esta data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg max-w-md mx-auto my-4">
      <h3 className="text-lg font-bold mb-3">📄 Inteligência de Reunião (Gemini)</h3>
      
      <div className="mb-3">
        <label className="block text-sm mb-1">Data da Reunião:</label>
        <input 
          type="date" 
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">O que pretendes gerar?</label>
        <select 
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
          value={option} 
          onChange={(e) => setOption(e.target.value)}
        >
          <option value="resumo">Fazer Resumo Executivo</option>
          <option value="acta">Fazer Acta Formal da Reunião</option>
          <option value="relatorio">Fazer Relatório Detalhado</option>
          <option value="coerencia">Organizar tudo com Coerência (Texto Inteiro)</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => handleDownload('pdf')}
          disabled={loading}
          className="flex-1 bg-red-600 hover:bg-red-700 p-2 rounded text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'A processar...' : 'Baixar PDF'}
        </button>
        <button 
          onClick={() => handleDownload('word')}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'A processar...' : 'Baixar Word'}
        </button>
      </div>
    </div>
  )
}