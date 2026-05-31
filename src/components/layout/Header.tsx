import React from 'react'
import { Search, MoreVertical } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  onSearch?: (query: string) => void
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, onSearch, actions }: HeaderProps) {
  return (
    <div className="bg-white dark:bg-whatsapp-header-dark border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      
      {onSearch && (
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-whatsapp-input-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-whatsapp-green text-gray-900 dark:text-white"
          />
        </div>
      )}
    </div>
  )
}