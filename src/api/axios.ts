import axios from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '@/config/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request interceptor: attach JWT ──────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rkt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle errors globally ─────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || 'An unexpected error occurred'

    if (status === 401) {
      localStorage.removeItem('rkt_token')
      localStorage.removeItem('rkt_user')
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (status === 404) {
      // Let individual pages handle 404
    } else if (status === 500) {
      toast.error('Server error. Please try again later.')
    } else if (!error.response) {
      toast.error('Network error. Check if the backend is running.')
    } else if (status !== 404) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
