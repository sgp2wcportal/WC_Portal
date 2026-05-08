import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { reportService } from '../services/reportService'

export const TreasuryPage = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTreasuryData()
  }, [])

  const fetchTreasuryData = async () => {
    try {
      const response = await reportService.getTreasuryDashboard()
      setData(response.data)
    } catch (err) {
      setError('Failed to fetch treasury data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading treasury data...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (!data) return <div className="p-8">No data available</div>

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

  const expenseByCategory = data.expenses?.by_category || []
  const donationByType = data.donations?.by_type || []

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Treasury Analytics Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card bg-green-50 border-green-200">
          <p className="text-gray-600 text-sm">Total Income</p>
          <p className="text-3xl font-bold text-green-600">
            ₹{data.total_income?.toFixed(2) || 0}
          </p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <p className="text-gray-600 text-sm">Total Expense</p>
          <p className="text-3xl font-bold text-red-600">
            ₹{data.total_expense?.toFixed(2) || 0}
          </p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-gray-600 text-sm">Donations & Sponsorship</p>
          <p className="text-3xl font-bold text-blue-600">
            ₹{data.donations?.total?.toFixed(2) || 0}
          </p>
        </div>
        <div className={`card ${data.balance >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className="text-gray-600 text-sm">Balance</p>
          <p className={`text-3xl font-bold ${data.balance >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
            ₹{data.balance?.toFixed(2) || 0}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subscriptions vs Income */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Subscriptions Overview</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Total Subscriptions Collected</p>
              <p className="text-2xl font-bold">₹{data.subscriptions?.total_amount?.toFixed(2) || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Subscribers</p>
              <p className="text-2xl font-bold">{data.subscriptions?.total_subscriptions || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average per Subscription</p>
              <p className="text-2xl font-bold">₹{data.subscriptions?.average_amount?.toFixed(2) || 0}</p>
            </div>
          </div>
        </div>

        {/* Donations Breakdown */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Donations by Type</h3>
          {donationByType.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={donationByType}
                  dataKey="amount"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {donationByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No donation data available</p>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expenses by Category */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Expenses by Category</h3>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500">No expense data available</p>
          )}
        </div>

        {/* Income vs Expense */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Income vs Expense</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              {
                name: 'Treasury',
                income: data.total_income || 0,
                expense: data.total_expense || 0,
              }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#10b981" />
              <Bar dataKey="expense" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Top Expense Categories</h3>
          {expenseByCategory.length > 0 ? (
            <div className="space-y-2">
              {expenseByCategory
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2">
                    <span className="capitalize">{item.category.replace('_', ' ')}</span>
                    <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>

        {/* Donation Breakdown */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Donation Details</h3>
          {donationByType.length > 0 ? (
            <div className="space-y-2">
              {donationByType.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="capitalize font-medium">{item.type}</p>
                    <p className="text-xs text-gray-600">{item.count} donor(s)</p>
                  </div>
                  <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>
      </div>
    </div>
  )
}
