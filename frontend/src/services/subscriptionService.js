import api from './api'

export const subscriptionService = {
  createSubscription: (subscription) => api.post('/subscriptions/', subscription),
  
  getSubscriptions: () => api.get('/subscriptions/'),
  
  getSubscription: (id) => api.get(`/subscriptions/${id}`),
  
  getAnalytics: () => api.get('/subscriptions/analytics'),

  verify: (id, verified = true) => api.patch(`/subscriptions/${id}/verify`, { verified }),

  exportExcel: () => api.get('/subscriptions/export.xlsx', { responseType: 'blob' }),

  deleteSubscription: (id) => api.delete(`/subscriptions/${id}`),
}
