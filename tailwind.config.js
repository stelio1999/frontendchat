/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'whatsapp-green': '#25D366',
        'whatsapp-dark': '#075E54',
        'whatsapp-light': '#DCF8C6',
        'whatsapp-bg-light': '#E5E5E5',
        'whatsapp-chat-bg-light': '#F0F2F5',
        'whatsapp-chat-bg-dark': '#0C1317',
        'whatsapp-sidebar-dark': '#111B21',
        'whatsapp-header-dark': '#202C33',
        'whatsapp-input-dark': '#2A3942',
      },
      animation: {
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
        'blur-in': 'blurIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        skeleton: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        blurIn: {
          '0%': { filter: 'blur(10px)', opacity: 0 },
          '100%': { filter: 'blur(0)', opacity: 1 },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}