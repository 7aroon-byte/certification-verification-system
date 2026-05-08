import axios from 'axios'

// Use VITE_API_BASE_URL for Vercel integration, fallback to localhost for dev
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://certification-verification-system.onrender.com/api'
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.code === 'FIRST_LOGIN_PASSWORD_RESET_REQUIRED'
    ) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/admin/profile') {
        window.location.href = '/admin/profile?firstLogin=1';
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      // Check if this is a login endpoint - don't redirect for login failures
      const isLoginRequest = error.config?.url?.includes('/login')
      
      if (!isLoginRequest) {
        // Get role before clearing
        const role = localStorage.getItem('role')
        
        // Token is invalid or expired - clear storage
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        
        // Redirect to appropriate login page based on previous role
        if (role === 'admin') {
          window.location.href = '/admin/login'
        } else if (role === 'student') {
          window.location.href = '/student/login'
        } else {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

export function verifyCertificatePublic(code) {
  return api.get('/verify', { params: { code } })
}

export function verifyCertificateByHash({ code = '', pdfHash }) {
  return api.post('/verify/hash', { code, pdfHash })
}
