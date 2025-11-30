import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 自定义插件：拦截并重写 jsdelivr 请求到本地文件
    {
      name: 'rewrite-jsdelivr-requests',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // 拦截 jsdelivr 的 unicode-font-resolver 请求
          if (req.url?.includes('cdn.jsdelivr.net/gh/lojjic/unicode-font-resolver')) {
            // 提取文件名
            const match = req.url.match(/plane0\/([^/?]+)/)
            if (match) {
              req.url = `/data/${match[1]}`
            }
          }
          next()
        })
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
