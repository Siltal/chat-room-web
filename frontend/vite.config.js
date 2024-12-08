import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 将 `/api` 代理到后端服务
      '/api': {
        target: 'http://localhost:3000', // 后端服务地址
        changeOrigin: true, // 修改请求源，避免后端拒绝
      },
      // 将 `/avatars` 代理到后端服务
      '/avatars': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'ws://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
