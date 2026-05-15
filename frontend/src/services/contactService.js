import api from './api'

export const contactService = {
  list: () => api.get('/contacts/'),
  create: (data) => api.post('/contacts/', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
}
