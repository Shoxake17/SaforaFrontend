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
      strictPort: false, // Port band bo'lsa, keyingi free portga o'tadi
      open: false, // Brauzerni avtomatik ochmaslik (true qilsangiz ochiladi)
      host: true, // Tarmoqda ko'rinadigan qilish (telefondan test uchun)
      cors: true,

      // Backend proxy
      proxy: {
        '/auth': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
        },
        '/portal': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
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

    // Preview server (npm run preview uchun)
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
          // Chunk'larni mantiqiy bo'lib tashlash (cache yaxshilash)
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
          // Asset fayllarni nomlanish patterni
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },

      // Console.log'larni production'da o'chirish (ixtiyoriy)
      // terserOptions: {
      //   compress: {
      //     drop_console: true,
      //   },
      // },
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