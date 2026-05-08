import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus,
  X,
  Search,
  Filter,
  Receipt,
  Sparkles,
  Settings2,
  Download,
  ArrowUpDown,
  ChevronDown,
  Wallet,
  Tag,
  CalendarDays,
  Paperclip,
} from 'lucide-react'

import { expenseService } from '../services/expenseService'
import { triggerDownload } from '../lib/download'
import { useAuthStore } from '../store/authStore'
import { LookupEditor } from '../components/LookupEditor'

const fmtINR = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const fmtDate = (raw, withTime = false) => {
  if (!raw) return '—'
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw + 'Z'
  const d = new Date(iso)
  return d.toLocaleString(undefined, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' })
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = {
  category: '',
  occasion: '',
  amount: '',
  paid_to: '',
  description: '',
  expense_date: today(),
}

export const ExpensesPage = () => {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'admin' || role === 'generic'

  const [expenses, setExpenses] = useState([])
  const [categories, setCategories] = useState([])
  const [occasions, setOccasions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [receipt, setReceipt] = useState(null)
  const [showLookups, setShowLookups] = useState(false)
  const fileRef = useRef(null)

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterOccasion, setFilterOccasion] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [sortKey, setSortKey] = useState('expense_date')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [ex, cats, occs] = await Promise.all([
        expenseService.getExpenses(),
        expenseService.listCategories(),
        expenseService.listOccasions(),
      ])
      setExpenses(ex.data)
      setCategories(cats.data)
      setOccasions(occs.data)
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const reloadLookups = async () => {
    try {
      const [cats, occs] = await Promise.all([
        expenseService.listCategories(),
        expenseService.listOccasions(),
      ])
      setCategories(cats.data)
      setOccasions(occs.data)
    } catch {
      // already toasted by caller
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.category || !formData.occasion) {
      toast.error('Pick a Category and Occasion')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        category: formData.category,
        occasion: formData.occasion,
        amount: Number(formData.amount),
        paid_to: formData.paid_to.trim(),
        description: formData.description.trim(),
        expense_date: formData.expense_date
          ? new Date(formData.expense_date + 'T12:00:00').toISOString()
          : null,
      }
      await expenseService.createExpense(payload, receipt)
      setFormData({ ...emptyForm, expense_date: today() })
      setReceipt(null)
      if (fileRef.current) fileRef.current.value = ''
      setShowForm(false)
      toast.success('Expense recorded')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const r = await expenseService.exportExcel()
      triggerDownload(r, 'expenses.xlsx')
      toast.success('Excel downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expenses.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false
      if (filterOccasion && e.occasion !== filterOccasion) return false
      if (q && !(e.paid_to || '').toLowerCase().includes(q)) return false
      const ref = e.expense_date || e.created_at
      if (filterFrom && new Date(ref) < new Date(filterFrom + 'T00:00:00')) return false
      if (filterTo && new Date(ref) > new Date(filterTo + 'T23:59:59')) return false
      return true
    })
  }, [expenses, search, filterCategory, filterOccasion, filterFrom, filterTo])

  const sorted = useMemo(() => {
    const cmp = (a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const sign = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'amount') return sign * (Number(av) - Number(bv))
      if (sortKey === 'expense_date' || sortKey === 'created_at') return sign * (new Date(av).getTime() - new Date(bv).getTime())
      return sign * String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
    }
    return [...filtered].sort(cmp)
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const totalAmount = useMemo(() => filtered.reduce((s, e) => s + Number(e.amount || 0), 0), [filtered])

  const clearFilters = () => {
    setSearch('')
    setFilterCategory('')
    setFilterOccasion('')
    setFilterFrom('')
    setFilterTo('')
  }

  const anyFilter = search || filterCategory || filterOccasion || filterFrom || filterTo

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hero mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-rose-300/30 blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-4 w-32 h-32 motif-dots rounded-full opacity-40 animate-spin-slow pointer-events-none" />
        <div className="relative">
          <p className="text-saffron-700 font-semibold text-xs uppercase tracking-[0.2em] mb-2 inline-flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" /> Outflows
          </p>
          <h1 className="display-title text-4xl md:text-5xl">
            Expense <span className="gradient-text italic">Tracking</span>
          </h1>
          <p className="muted mt-2 text-base">Where the committee's money goes — every rupee, recorded.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button onClick={() => setShowLookups((v) => !v)} className="btn btn-secondary">
              <Settings2 className="w-4 h-4" /> Manage dropdowns
            </button>
          )}
          {isAdmin && (
            <button onClick={handleDownload} disabled={downloading} className="btn btn-indigo">
              <Download className="w-4 h-4" />
              {downloading ? 'Preparing…' : 'Export Excel'}
            </button>
          )}
          <button onClick={() => setShowForm((v) => !v)} className={showForm ? 'btn btn-secondary' : 'btn btn-primary'}>
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add expense</>}
          </button>
        </div>
      </motion.div>

      {/* Lookup manager (admin) */}
      <AnimatePresence>
        {showLookups && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LookupEditor
                title="Categories"
                hint="Used in the Category dropdown when adding a new expense. Renames cascade to existing expenses."
                items={categories}
                onAdd={async (name) => {
                  try {
                    await expenseService.addCategory(name)
                    toast.success('Category added')
                    reloadLookups()
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Could not add')
                  }
                }}
                onDelete={async (id, name) => {
                  try {
                    await expenseService.deleteCategory(id)
                    toast.success(`Removed "${name}"`)
                    reloadLookups()
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Could not delete')
                  }
                }}
                onRename={async (id, newName, oldName) => {
                  try {
                    await expenseService.renameCategory(id, newName)
                    toast.success(`Renamed "${oldName}" → "${newName}"`)
                    reloadLookups()
                    fetchAll()
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Could not rename')
                  }
                }}
              />
              <LookupEditor
                title="Occasions"
                hint="Used in the Occasion dropdown when adding a new expense. Renames cascade to existing expenses."
                items={occasions}
                onAdd={async (name) => {
                  try {
                    await expenseService.addOccasion(name)
                    toast.success('Occasion added')
                    reloadLookups()
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Could not add')
                  }
                }}
                onDelete={async (id, name) => {
                  try {
                    await expenseService.deleteOccasion(id)
                    toast.success(`Removed "${name}"`)
                    reloadLookups()
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Could not delete')
                  }
                }}
                onRename={async (id, newName, oldName) => {
                  try {
                    await expenseService.renameOccasion(id, newName)
                    toast.success(`Renamed "${oldName}" → "${newName}"`)
                    reloadLookups()
                    fetchAll()
                  } catch (err) {
                    toast.error(err.response?.data?.detail || 'Could not rename')
                  }
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="card-elevated mb-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Category" required>
                  <select className="input-field" required value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Occasion" required>
                  <select className="input-field" required value={formData.occasion}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}>
                    <option value="">Select occasion</option>
                    {occasions.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                </Field>
                <Field label="Amount (₹)" required>
                  <input type="number" min="1" step="0.01" className="input-field" required value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
                </Field>
                <Field label="Paid To" required>
                  <input type="text" className="input-field" required value={formData.paid_to}
                    onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
                    placeholder="Vendor / payee name" />
                </Field>
                <Field label="Date" required>
                  <input type="date" className="input-field" required value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    max={today()} />
                </Field>
                <Field label="Receipt / Bill (optional)">
                  <input ref={fileRef} type="file" accept="image/*,application/pdf"
                    className="input-field !p-2"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                </Field>
              </div>
              <Field label="Description">
                <textarea className="input-field h-20" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional note for context" />
              </Field>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  <Sparkles className="w-4 h-4" />
                  {submitting ? 'Saving…' : 'Save expense'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatPill label="Records" value={filtered.length} icon={Receipt} accent="bg-rose-500" />
        <StatPill label="Total spent" value={fmtINR(totalAmount)} icon={Wallet} accent="bg-emerald-grad" />
        <StatPill label="Categories" value={categories.length} icon={Tag} accent="bg-saffron-grad" />
        <StatPill label="Occasions" value={occasions.length} icon={CalendarDays} accent="bg-indigo-grad" />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-ink-600" />
          <p className="font-semibold text-sm text-ink-800">Search & filter</p>
          {anyFilter && (
            <button onClick={clearFilters} className="ml-auto text-xs text-saffron-700 hover:text-saffron-800 font-semibold">
              Clear all
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by Paid To…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select className="input-field" value={filterOccasion} onChange={(e) => setFilterOccasion(e.target.value)}>
            <option value="">All occasions</option>
            {occasions.map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="input-field" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} title="From date" />
            <input type="date" className="input-field" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} title="To date" />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card h-40 skeleton" />
      ) : sorted.length === 0 ? (
        <div className="card-elevated text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-6 h-6 text-rose-600" />
          </div>
          <p className="font-display text-xl font-semibold text-ink-900">
            {anyFilter ? 'No expenses match' : 'No expenses recorded yet'}
          </p>
          <p className="muted mt-1">
            {anyFilter ? 'Try clearing some filters.' : 'Click "Add expense" to log the first one.'}
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-600 border-b border-ink-100 bg-ink-50/40">
                <Th label="Date"        k="expense_date" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('expense_date')} />
                <Th label="Category"    k="category"     sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('category')} />
                <Th label="Occasion"    k="occasion"     sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('occasion')} />
                <Th label="Paid To"     k="paid_to"      sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('paid_to')} />
                <Th label="Amount"      k="amount"       sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('amount')} />
                <th className="px-4 py-3 font-semibold whitespace-nowrap">Receipt</th>
                <Th label="Recorded"    k="created_at"   sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('created_at')} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((e, idx) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                  className="border-b border-ink-100 hover:bg-saffron-50/30 transition-colors"
                >
                  <td className="px-4 py-3 text-ink-700 whitespace-nowrap">{fmtDate(e.expense_date || e.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-blue">{e.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge badge-amber">{e.occasion}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {e.paid_to}
                    {e.description && (
                      <p className="text-xs text-ink-500 mt-0.5 truncate max-w-[260px]" title={e.description}>
                        {e.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-rose-600">{fmtINR(e.amount)}</td>
                  <td className="px-4 py-3">
                    {e.receipt_file ? (
                      <a
                        href={`http://localhost:8000/storage/${String(e.receipt_file).replace(/\\/g, '/').replace(/^\.\.?\/?storage\/?/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-saffron-700 hover:text-saffron-800 text-xs font-semibold"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> View
                      </a>
                    ) : (
                      <span className="text-ink-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{fmtDate(e.created_at)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
  </label>
)

const StatPill = ({ label, value, icon: Icon, accent }) => (
  <div className="card flex items-center gap-3">
    <div className={`w-10 h-10 rounded-xl ${accent} text-white flex items-center justify-center shadow-sm`}>
      {Icon ? <Icon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">{label}</p>
      <p className="font-display text-xl font-semibold text-ink-900 truncate">{value}</p>
    </div>
  </div>
)

const Th = ({ label, k, sortKey, sortDir, onClick }) => {
  const active = sortKey === k
  return (
    <th
      onClick={onClick}
      className={`px-4 py-3 cursor-pointer select-none font-semibold whitespace-nowrap ${active ? 'text-ink-900' : 'text-ink-600 hover:text-ink-900'}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        {active ? (
          <ChevronDown className={`w-3.5 h-3.5 ${sortDir === 'asc' ? 'rotate-180' : ''} transition-transform`} />
        ) : (
          <ArrowUpDown className="w-3 h-3 text-ink-300" />
        )}
      </span>
    </th>
  )
}

