import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chat': 'http://127.0.0.1:8000',
      '/chat-log': 'http://127.0.0.1:8000',
      '/assessment': 'http://127.0.0.1:8000',  // ⬅️ 핵심
      '/user': 'http://127.0.0.1:8000',
      '/crisis': 'http://127.0.0.1:8000',
      '/rag': 'http://127.0.0.1:8000'
    }
  }
})