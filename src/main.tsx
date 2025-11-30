import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupFetchInterceptor } from './utils/fetchInterceptor'

// 在应用启动前设置 fetch 拦截器，解决 jsdelivr CDN 访问问题
setupFetchInterceptor()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
