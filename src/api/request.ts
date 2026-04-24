import axios, { type AxiosRequestConfig } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://arvis-api-uat.zhilingtech.com";

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器：自动附加 JWT token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：解包 { code, message, data } 结构
request.interceptors.response.use(
  (response) => {
    // blob 响应直接返回，不解包
    if (response.config.responseType === "blob") {
      return response.data;
    }
    const res = response.data;
    // 后端统一响应格式: { code, message, data, timestamp }
    if (res.code !== undefined && res.code !== 200) {
      return Promise.reject(new Error(res.message || "请求失败"));
    }
    return res.data;
  },
  (error) => {
    // 登录/注册、用户信息接口的 401 不做跳转，交给业务层处理
    const url = error.config?.url || "";
    const skipRedirect = url.includes("/auth/") || url.includes("/user/me");
    if (error.response?.status === 401 && !skipRedirect) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    const msg = error.response?.data?.message || error.message;
    return Promise.reject(new Error(msg));
  },
);

// 封装请求方法，覆盖 axios 默认返回类型（拦截器已解包为 data）
const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config) as unknown as Promise<T>;
  },
  post<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return request.post(url, data, config) as unknown as Promise<T>;
  },
  put<T = any>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return request.put(url, data, config) as unknown as Promise<T>;
  },
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config) as unknown as Promise<T>;
  },
};

export default http;
