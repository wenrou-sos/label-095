import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const TIMEOUT = 30000

const requestConfig: AxiosRequestConfig = {
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
}

const api: AxiosInstance = axios.create(requestConfig)

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (import.meta.env.DEV) {
      console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '')
    }

    return config
  },
  (error) => {
    console.error('[Request Error]', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (import.meta.env.DEV) {
      console.log(`[Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data)
    }

    const { data } = response
    if (data && data.code !== undefined && data.code !== 200) {
      console.error('[API Error]', data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }

    return data
  },
  (error) => {
    const { response } = error

    if (response) {
      const { status, data } = response

      if (import.meta.env.DEV) {
        console.error(`[Response Error] ${status}`, data)
      }

      switch (status) {
        case 401:
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('没有权限访问该资源')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(data?.message || `请求失败: ${status}`)
      }

      return Promise.reject(new Error(data?.message || `请求失败: ${status}`))
    } else if (error.request) {
      console.error('[Network Error] 网络连接失败，请检查网络设置')
      return Promise.reject(new Error('网络连接失败，请检查网络设置'))
    } else {
      console.error('[Error]', error.message)
      return Promise.reject(error)
    }
  }
)

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.get<unknown, T>(url, config)
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return api.post<unknown, T>(url, data, config)
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return api.put<unknown, T>(url, data, config)
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.delete<unknown, T>(url, config)
}

export { api, BASE_URL, TIMEOUT }

export default api
