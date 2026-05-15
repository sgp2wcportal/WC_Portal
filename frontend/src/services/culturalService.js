import api from './api'

export const culturalService = {
  listCategories: () => api.get('/cultural/categories'),
  list: () => api.get('/cultural/'),
  create: (data) => api.post('/cultural/', data),
  update: (id, data) => api.put(`/cultural/${id}`, data),
  delete: (id) => api.delete(`/cultural/${id}`),
}
