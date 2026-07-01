import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallbackDenylist: [/^\/oauth2\//, /^\/login\//, /^\/api\//],
      },
      manifest: {
        name: 'ToGather - 즉석 모임 매칭',
        short_name: 'ToGather',
        start_url: '/',
        display: 'standalone',
        background_color: '#16A9C4',
        theme_color: '#16A9C4',
        icons: [
          { src: '/icon/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/login/oauth2': 'http://localhost:8080',
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})

