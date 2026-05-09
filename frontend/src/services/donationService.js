import api from './api'

export const donationService = {
  createDonation: (donation) => api.post('/donations/', donation),
  
  getDonations: () => api.get('/donations/'),
  
  getDonation: (id) => api.get(`/donations/${id}`),
  
  getAnalytics: () => api.get('/donations/analytics'),

  verify: (id, verified = true) => api.patch(`/donations/${id}/verify`, { verified }),

  exportExcel: () => api.get('/donations/export.xlsx', { responseType: 'blob' }),

  deleteDonation: (id) => api.delete(`/donations/${id}`),
}
