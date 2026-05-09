import api from './api'

export const expenseService = {
  createExpense: (expense, receipt = null) => {
    if (receipt) {
      const formData = new FormData()
      formData.append('category', expense.category)
      formData.append('occasion', expense.occasion)
      formData.append('amount', expense.amount)
      formData.append('paid_to', expense.paid_to)
      formData.append('description', expense.description ?? '')
      if (expense.expense_date) formData.append('expense_date', expense.expense_date)
      formData.append('receipt', receipt)
      return api.post('/expenses/with-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return api.post('/expenses/', expense)
  },

  getExpenses: () => api.get('/expenses/'),
  getExpense: (id) => api.get(`/expenses/${id}`),
  getAnalytics: () => api.get('/expenses/analytics'),

  // Lookup options (admin-managed dropdowns)
  listCategories:  () => api.get('/expenses/categories/'),
  addCategory:     (name) => api.post('/expenses/categories/', { name }),
  deleteCategory:  (id)   => api.delete(`/expenses/categories/${id}`),
  renameCategory:  (id, name) => api.patch(`/expenses/categories/${id}`, { name }),

  listOccasions:   () => api.get('/expenses/occasions/'),
  addOccasion:     (name) => api.post('/expenses/occasions/', { name }),
  deleteOccasion:  (id)   => api.delete(`/expenses/occasions/${id}`),
  renameOccasion:  (id, name) => api.patch(`/expenses/occasions/${id}`, { name }),

  exportExcel: () => api.get('/expenses/export.xlsx', { responseType: 'blob' }),

  deleteExpense: (id) => api.delete(`/expenses/${id}`),
}
