import api from './api'

export const announcementService = {
  createAnnouncement: (announcement) => api.post('/announcements/', announcement),
  
  getAnnouncements: () => api.get('/announcements/'),
  
  getAnnouncement: (id) => api.get(`/announcements/${id}`),
  
  updateAnnouncement: (id, announcement) => api.put(`/announcements/${id}`, announcement),
  
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`)
}
