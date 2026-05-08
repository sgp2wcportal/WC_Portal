import api from './api'

export const authService = {
  login: (username, password) => api.post('/auth/login', { username, password }),

  register: (payload) => api.post('/auth/register', payload),

  getMe: () => api.get('/users/me'),

  updateMe: (patch) => api.patch('/users/me', patch),

  changePassword: (current_password, new_password) =>
    api.post('/users/me/change-password', { current_password, new_password }),

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
  },
}
