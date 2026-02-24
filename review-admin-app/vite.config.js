import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://porongas-2.myshopify.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/admin/api/2024-01'),
      },
    },
  },
})
