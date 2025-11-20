import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vite dev server handles SPA routing automatically
  // For production, ensure your hosting provider is configured
  // to serve index.html for all routes (see vercel.json and public/_redirects)
})
