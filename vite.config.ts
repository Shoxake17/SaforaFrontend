// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env fayllardan o'zgaruvchilarni yuklash
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],

    // Path aliases — toza importlar uchun
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },

    // Dev server sozlamalari
    server: {
      port: 5173,
      strictPort: false,
      open: false,
      host: true,
      cors: true,

      // ═══════════════════════════════════════════════
      // Backend proxy — MUHIM bypass logikasi
      // ═══════════════════════════════════════════════
      proxy: {
        // ─── /auth/* — backend'ga, faqat google success bypass ───
        '/auth': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            // /auth/google/success — frontend route
            if (req.url?.startsWith('/auth/google/success')) {
              return req.url
            }
          },
        },

        // ─── /portal — frontend route'lar va API ajratish ───
        '/portal': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          bypass: (req) => {
            // ✅ Faqat ACCEPT: text/html bo'lsa frontend (brauzer to'g'ridan-to'g'ri kirgan)
            // Bu /portal/{slug} ko'rinishidagi URL'lar uchun
            if (req.headers.accept?.includes('text/html')) {
              return req.url // Vite o'zi handle qiladi (React Router)
            }
            // Aks holda backend'ga uzatiladi (API so'rovlari uchun)
          },
        },

        // ─── /api/* — har doim backend ───
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },

        // ─── /uploads/* — har doim backend (fayllar) ───
        '/uploads': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },

        // ─── /telegram/* — har doim backend ───
        '/telegram': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },

    // Preview server
    preview: {
      port: 4173,
      host: true,
    },

    // Production build sozlamalari
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      target: 'esnext',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,

      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },

    // CSS sozlamalari
    css: {
      devSourcemap: true,
    },

    // Optimizatsiya
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  }
})