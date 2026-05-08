import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())

  return isAuthenticated ? children : <Navigate to="/" replace />
}

export const RoleRoute = ({ children, requiredRoles }) => {
  const role = useAuthStore((state) => state.role)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())

  if (!isAuthenticated) return <Navigate to="/" replace />

  if (requiredRoles && !requiredRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
