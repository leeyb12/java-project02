/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      host: true,
      // HMR 연결에 사용할 호스트를 환경변수로 설정합니다.
      // Windows PowerShell에서 실행 전: $env:HOST_IP="192.168.x.y"
      hmr: {
        host: (typeof process !== 'undefined' && process.env.HOST_IP) || undefined,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
