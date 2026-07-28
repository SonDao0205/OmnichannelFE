import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('omni_session_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add Idempotency key for write requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      config.headers['Idempotency-Key'] = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('API Call Warning/Error:', error?.response?.status || error.message)
    return Promise.reject(error)
  }
)
