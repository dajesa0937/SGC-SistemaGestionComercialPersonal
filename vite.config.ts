/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SGC Personal',
        short_name: 'SGC',
        description: 'Sistema de Gestión Comercial Personal',
        lang: 'es-CO',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        theme_color: '#0e6a62',
        background_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  /**
   * El puerto es parte de la identidad de los datos.
   *
   * IndexedDB se guarda por origen, y el origen incluye el puerto: lo que se
   * carga en `localhost:4173` NO existe en `localhost:4174`. Si Vite encontrara
   * el puerto ocupado y se moviera al siguiente, la aplicacion abriria vacia y
   * pareceria que se perdio todo.
   *
   * `strictPort` evita justo eso: prefiere fallar con un mensaje claro antes que
   * arrancar en otro puerto y asustar al usuario.
   */
  preview: {
    port: 4173,
    strictPort: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/application/**', 'src/domain/**', 'src/lib/**'],
      thresholds: {
        'src/application/indicadores/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  },
})
