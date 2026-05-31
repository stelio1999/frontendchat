import React, { useState, useRef } from 'react'
import { Send, Paperclip, Smile, Mic, X } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

interface MessageInputProps {
  onSendMessage: (content: string, file?: File) => void
  onTyping?: () => void
}

export default function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      onSendMessage(message.trim(), selectedFile || undefined)
      setMessage('')
      setSelectedFile(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 100MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }






  
  return (
    <div className="bg-white dark:bg-whatsapp-input-dark p-3 border-t border-gray-200 dark:border-gray-700">
      {selectedFile && (
        <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip size={16} />
            <span className="text-sm truncate">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">
              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
          <button onClick={removeFile} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <Paperclip size={20} className="text-gray-500" />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <Smile size={20} className="text-gray-500" />
        </button>
        
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            onTyping?.()
          }}
          onKeyPress={handleKeyPress}
          placeholder="Digite uma mensagem..."
          className="flex-1 resize-none bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 max-h-32 focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          rows={1}
        />
        
        {message.trim() || selectedFile ? (
          <button
            onClick={handleSend}
            className="p-2 bg-whatsapp-green text-white rounded-full hover:bg-whatsapp-dark transition-colors"
          >
            <Send size={20} />
          </button>
        ) : (
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Mic size={20} className="text-gray-500" />
          </button>
        )}
      </div>
      
      {showEmoji && (
        <div className="absolute bottom-20 right-4 z-50">
          <EmojiPicker
            onEmojiClick={(emoji) => {
              setMessage(prev => prev + emoji.emoji)
              setShowEmoji(false)
            }}
            theme="light"
          />
        </div>
      )}
    </div>
  )
}