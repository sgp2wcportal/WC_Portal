import api from './api'

export const paymentService = {
  // amount/note both optional. Returns { upi_id, upi_name, upi_uri } — pass to QRCodeCanvas.
  upiInfo: (amount, note) =>
    api.get('/payments/upi-info', { params: { ...(amount ? { amount } : {}), ...(note ? { note } : {}) } }),
}
