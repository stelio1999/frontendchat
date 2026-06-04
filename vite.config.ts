import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills' // 👈 Importa o plugin de Polyfills

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({ // 👈 Ativa os polyfills de forma segura para o Rollup resolver
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ❌ REMOVIDO: O bloco "define" que injetava 'window' manualmente foi removido,
  // pois causava o erro "../internals/define-window-property".

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
})