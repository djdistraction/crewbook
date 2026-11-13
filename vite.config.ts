import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CrewBook',
        short_name: 'CrewBook',
        description: 'Staffing and booking dashboard for hospitality and entertainment.',
        theme_color: '#186a8a', // Matches your --accent color
        background_color: '#e9edf0', // Matches your --bg color
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png', // Add a 192x192 logo to your public/ folder
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Add a 512x512 logo to your public/ folder
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
