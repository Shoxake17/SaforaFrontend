// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// ✅ ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:5000'
  const isGuest = mode === 'guest'

  return {
    plugins: [
      react(),
      // ⭐ Guest mode'da har qanday SPA route uchun index-guest.html ni serve qilish
      {
        name: 'guest-html-redirect',
        configureServer(server) {
          if (!isGuest) return

          console.log('[guest-html-redirect] Plugin loaded for guest mode')

          server.middlewares.use(async (req, res, next) => {
            const url = req.url || ''

            // Vite ichki, asset, API va proxy so'rovlarini o'tkazib yuborish
            if (
              url.startsWith('/@') ||
              url.startsWith('/src/') ||
              url.startsWith('/node_modules/') ||
              url.startsWith('/api/') ||
              url.startsWith('/uploads/') ||
              url.startsWith('/auth/') ||
              url.startsWith('/portal/') ||
              url.startsWith('/telegram/') ||
              /\.[\w]+(\?|$)/.test(url)
            ) {
              return next()
            }

            // index-guest.html ni to'g'ridan-to'g'ri o'qib serve qilish
            try {
              console.log('[guest-html-redirect] serving', url, '→ index-guest.html')

              const filePath = path.resolve(__dirname, 'index-guest.html')
              let html = await fs.readFile(filePath, 'utf-8')

              // Vite HTML transform (HMR scriptlari va boshqa optimizatsiyalar)
              html = await server.transformIndexHtml(url, html, req.originalUrl)

              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
              res.setHeader('Pragma', 'no-cache')
              res.setHeader('Expires', '0')
              res.statusCode = 200
              res.end(html)
            } catch (err) {
              console.error('[guest-html-redirect] error:', err)
              next(err)
            }
          })
        },
      },
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@apptypes': path.resolve(__dirname, './src/types'),
        '@config': path.resolve(__dirname, './src/config'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@constants': path.resolve(__dirname, './src/constants'), 
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },

    server: {
      port: isGuest ? 5174 : 5173,
      strictPort: true,
      open: false,
      host: true,
      cors: true,

      proxy: {
        '/auth': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.url?.startsWith('/auth/google/success')) {
              return req.url
            }
          },
        },
        '/portal': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            if (req.headers.accept?.includes('text/html')) {
              return req.url
            }
          },
        },
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/telegram': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      port: isGuest ? 4174 : 4173,
      host: true,
    },

    build: {
      outDir: isGuest ? 'dist-guest' : 'dist',
      sourcemap: false,
      minify: 'oxc',
      target: 'esnext',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      cssMinify: 'esbuild',

      rollupOptions: {
        input: isGuest
          ? path.resolve(__dirname, 'index-guest.html')
          : path.resolve(__dirname, 'index.html'),

        output: {
          manualChunks: (id: string) => {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/')
            ) {
              return 'react-vendor'
            }
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },

          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },

    css: {
      devSourcemap: true,
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  }
})