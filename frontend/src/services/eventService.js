import api from './api'

export const eventService = {
  listEvents:  () => api.get('/events/'),
  getEvent:    (id) => api.get(`/events/${id}`),
  createEvent: (payload) => api.post('/events/', payload),
  updateEvent: (id, patch) => api.put(`/events/${id}`, patch),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  uploadImage: (id, file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post(`/events/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
