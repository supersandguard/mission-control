import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// PWA disabled temporarily — VitePWA causes build failures with module resolution
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // VitePWA disabled — re-enable once build issue is resolved
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
    //     globPatterns: ['**/*.{html,css,ico,png,svg,webmanifest}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /\.js$/,
    //         handler: 'StaleWhileRevalidate',
    //         options: {
    //           cacheName: 'js-cache',
    //           expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
    //         },
    //       },
    //     ],
    //   },
    //   manifest: {
    //     name: 'SandGuard',
    //     short_name: 'SandGuard',
    //     description: 'Transaction firewall for Safe multisig.',
    //     theme_color: '#0f172a',
    //     background_color: '#0f172a',
    //     display: 'standalone',
    //     lang: 'en',
    //     icons: [
    //       { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    //       { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    //       { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    //     ],
    //   },
    // }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-web3': ['viem', 'wagmi', '@tanstack/react-query'],
          'vendor-daimo': ['@daimo/pay'],
        },
      },
    },
  },
  server: { port: 3000, host: true },
})
