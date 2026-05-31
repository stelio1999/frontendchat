import React from 'react'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useThemeStore } from '../../stores/themeStore'

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()

  const themes = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
    { value: 'system', icon: Laptop, label: 'Sistema' },
  ] as const

  return (
    <div className="relative group">
      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        {theme === 'light' && <Sun size={20} />}
        {theme === 'dark' && <Moon size={20} />}
        {theme === 'system' && <Laptop size={20} />}
      </button>
      
      <div className="absolute bottom-full left-0 mb-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2 space-y-1">
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                ${theme === value 
                  ? 'bg-whatsapp-green text-white' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}