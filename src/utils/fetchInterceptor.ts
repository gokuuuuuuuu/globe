/**
 * 拦截 fetch 和 XMLHttpRequest 请求，将 jsdelivr CDN 的 unicode-font-resolver 请求重定向到本地文件
 * 解决中国大陆无法访问 jsdelivr 的问题
 */
export function setupFetchInterceptor() {
  // 拦截 fetch 请求
  const originalFetch = window.fetch

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string

    if (typeof input === 'string') {
      url = input
    } else if (input instanceof URL) {
      url = input.href
    } else if (input instanceof Request) {
      url = input.url
    } else {
      url = String(input)
    }

    // 检查是否是 jsdelivr 的 unicode-font-resolver 请求
    if (url.includes('cdn.jsdelivr.net/gh/lojjic/unicode-font-resolver')) {
      // 提取文件名
      const match = url.match(/plane0\/([^/?]+)/)
      if (match) {
        // 重定向到本地文件
        const localUrl = `/data/${match[1]}`
        console.log(`[Fetch Interceptor] 重定向 ${url} -> ${localUrl}`)
        return originalFetch(localUrl, init)
      }
    }

    // 其他请求正常处理
    return originalFetch(input, init)
  }

  // 拦截 XMLHttpRequest 请求（某些库可能使用它）
  const originalOpen = XMLHttpRequest.prototype.open
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    const urlString = typeof url === 'string' ? url : url.href

    // 检查是否是 jsdelivr 的 unicode-font-resolver 请求
    if (urlString.includes('cdn.jsdelivr.net/gh/lojjic/unicode-font-resolver')) {
      // 提取文件名
      const match = urlString.match(/plane0\/([^/?]+)/)
      if (match) {
        // 重定向到本地文件
        const localUrl = `/data/${match[1]}`
        console.log(`[XHR Interceptor] 重定向 ${urlString} -> ${localUrl}`)
        return originalOpen.call(this, method, localUrl, async ?? true, username, password)
      }
    }

    // 其他请求正常处理
    return originalOpen.call(this, method, url, async ?? true, username, password)
  }
}

