import api from './api'

export const reportService = {
  getTreasuryDashboard: () => api.get('/reports/treasury-dashboard')
}
