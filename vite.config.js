import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    },
    allowedHosts: [
      "e4ce-2804-14c-90-8eff-b048-f09c-d1f1-f63e.ngrok-free.app"
    ]
  }
})
