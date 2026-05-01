// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ✅ ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_URL = env.VITE_API_URL || 'http://localhost:5000'

  return {
    plugins: [react()],


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
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },

    server: {
      port: 5173,
      strictPort: false,
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
      port: 4173,
      host: true,
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'oxc',
      target: 'esnext',
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      cssMinify: 'esbuild',

      rollupOptions: {
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