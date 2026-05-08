import axios from 'axios'

// Same origin in production (FastAPI serves both API and the built SPA).
// Override at build time with VITE_API_BASE_URL if you ever split them.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    config.params = {
      ...config.params,
      token: token
    }
  }
  return config
})

export default api
