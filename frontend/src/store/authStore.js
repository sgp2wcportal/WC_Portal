import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  username: localStorage.getItem('username') || null,
  
  setAuth: (token, role, username) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('username', username)
    set({ token, role, username })
  },
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    localStorage.removeItem('display_name')
    set({ token: null, role: null, username: null })
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}))
