import api from './api'

export const BACKEND_ORIGIN = 'http://localhost:8000'

export const storageUrl = (path) => {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const norm = String(path).replace(/\\/g, '/').replace(/^(\.\.?\/)*/, '')
  const stripped = norm.replace(/^storage\//, '')
  return `${BACKEND_ORIGIN}/storage/${stripped}`
}

export const couponService = {
  // Menus
  listMenus: (includeInactive = false) =>
    api.get(`/coupons/menus/?include_inactive=${includeInactive ? 'true' : 'false'}`),
  createMenu: (menu) => api.post('/coupons/menus/', menu),
  updateMenu: (id, patch) => api.put(`/coupons/menus/${id}`, patch),
  deleteMenu: (id) => api.delete(`/coupons/menus/${id}`),
  uploadMenuImage: (id, type, file) => {
    const form = new FormData()
    form.append('image', file)
    return api.post(`/coupons/menus/${id}/image?image_type=${type}`, form)
  },

  // Bookings
  bookCoupon: (payload) => api.post('/coupons/', payload),
  listMyCoupons: () => api.get('/coupons/'),
  listUserCoupons: (email) => api.get(`/coupons/user/${encodeURIComponent(email)}`),
  listEventCoupons: (eventName) => api.get(`/coupons/event/${encodeURIComponent(eventName)}`),
  eventDashboard: (eventName) => api.get(`/coupons/event/${encodeURIComponent(eventName)}/dashboard`),
  updateBooking: (id, patch) => api.put(`/coupons/${id}`, patch),

  // Verify
  verifyTicket: (code) => api.post('/coupons/verify', { code }),

  // Payment
  paymentInfo: (amount) =>
    api.get('/coupons/payment/info', { params: amount ? { amount } : {} }),

  // Admin-managed Occasion lookup
  listOccasions:   () => api.get('/coupons/occasions/'),
  addOccasion:     (name) => api.post('/coupons/occasions/', { name }),
  deleteOccasion:  (id)   => api.delete(`/coupons/occasions/${id}`),
  renameOccasion:  (id, name) => api.patch(`/coupons/occasions/${id}`, { name }),
}
