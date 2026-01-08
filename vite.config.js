import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/costes-arturo/', // <--- AÑADE ESTA LÍNEA (Usa el nombre que tendrá tu repositorio)
})