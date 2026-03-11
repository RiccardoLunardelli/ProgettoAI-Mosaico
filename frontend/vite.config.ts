import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      ".ngrok-free.dev",
      "172.27.200.118"
    ],
    proxy: {
      "/api": {
        target: "http://172.27.200.118:8000",
        changeOrigin: true
      }
    }
  }
})