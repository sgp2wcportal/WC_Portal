import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus,
  X,
  Search,
  CreditCard,
  Sparkles,
  Filter,
  ArrowUpDown,
  Users,
  ChevronDown,
  ShieldCheck,
  Clock,
  Download,
  Trash2,
} from 'lucide-react'

import { subscriptionService } from '../services/subscriptionService'
import { TOWERS, UNIT_NUMBERS } from '../lib/society'
import { UpiPaymentPanel } from '../components/UpiPaymentPanel'
import { useAuthStore } from '../store/authStore'
import { triggerDownload } from '../lib/download'

const fmtINR = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const fmtDate = (raw, withTime = false) => {
  if (!raw) return '—'
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw + 'Z'
  const d = new Date(iso)
  return d.toLocaleString(
    undefined,
    withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' },
  )
}

const emptyForm = {
  owner_name: '',
  contact_number: '',
  email: '',
  tower: '',
  unit_number: '',
  subscription_amount: '',
  family_members: '',
  is_rented: 'No',
  landlord_name: '',
  landlord_contact: '',
  payment_method: 'upi',
  txn_reference: '',
  payer_upi_id: '',
}

export const SubscriptionsPage = () => {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'admin' || role === 'generic'

  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [verifyingId, setVerifyingId] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const [search, setSearch] = useState('')
  const [filterTower, setFilterTower] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { fetchSubscriptions() }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await subscriptionService.getSubscriptions()
      setSubscriptions(response.data)
    } catch {
      toast.error('Failed to fetch subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.tower || !formData.unit_number) {
      toast.error('Please pick a Tower and Unit Number')
      return
    }
    setSubmitting(true)
    try {
      const isUpi = formData.payment_method === 'upi'
      const payload = {
        owner_name: formData.owner_name.trim(),
        contact_number: formData.contact_number.trim(),
        email: formData.email.trim(),
        tower: formData.tower,
        unit_number: formData.unit_number,
        subscription_amount: Number(formData.subscription_amount),
        family_members: Number(formData.family_members) || 0,
        is_rented: formData.is_rented === 'Yes',
        landlord_name: formData.is_rented === 'Yes' ? formData.landlord_name.trim() || null : null,
        landlord_contact: formData.is_rented === 'Yes' ? formData.landlord_contact.trim() || null : null,
        payment_method: formData.payment_method,
        txn_reference: isUpi ? (formData.txn_reference.trim() || null) : null,
        payer_upi_id: isUpi ? (formData.payer_upi_id.trim() || null) : null,
      }
      await subscriptionService.createSubscription(payload)
      setFormData(emptyForm)
      setShowForm(false)
      toast.success('Subscription added')
      fetchSubscriptions()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const r = await subscriptionService.exportExcel()
      triggerDownload(r, 'subscriptions.xlsx')
      toast.success('Excel downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleVerify = async (sub) => {
    setVerifyingId(sub.id)
    try {
      const r = await subscriptionService.verify(sub.id, !sub.is_verified)
      setSubscriptions((prev) => prev.map((s) => (s.id === sub.id ? r.data : s)))
      toast.success(r.data.is_verified ? 'Marked as verified' : 'Verification removed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update verification')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleDelete = (sub) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 min-w-[240px]">
          <p className="font-semibold text-ink-900">Delete this subscription?</p>
          <p className="text-xs text-ink-600">{sub.owner_name} — {sub.tower} {sub.unit_number}</p>
          <p className="text-xs text-rose-600 font-medium">This cannot be undone.</p>
          <div className="flex gap-2 mt-1">
            <button className="btn btn-danger flex-1 py-1.5 text-xs" onClick={async () => {
              toast.dismiss(t.id)
              try {
                await subscriptionService.deleteSubscription(sub.id)
                setSubscriptions((prev) => prev.filter((s) => s.id !== sub.id))
                toast.success('Deleted')
              } catch { toast.error('Failed to delete') }
            }}>Delete</button>
            <button className="btn btn-secondary flex-1 py-1.5 text-xs" onClick={() => toast.dismiss(t.id)}>Cancel</button>
          </div>
        </div>
      ),
      { duration: 8000 },
    )
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return subscriptions.filter((s) => {
      if (filterTower && s.tower !== filterTower) return false
      if (filterUnit && s.unit_number !== filterUnit) return false
      if (filterStatus === 'verified' && !s.is_verified) return false
      if (filterStatus === 'pending' && s.is_verified) return false
      if (q && !(s.owner_name || '').toLowerCase().includes(q)) return false
      if (filterFrom) {
        const d = new Date(s.created_at)
        if (d < new Date(filterFrom + 'T00:00:00')) return false
      }
      if (filterTo) {
        const d = new Date(s.created_at)
        if (d > new Date(filterTo + 'T23:59:59')) return false
      }
      return true
    })
  }, [subscriptions, search, filterTower, filterUnit, filterStatus, filterFrom, filterTo])

  const sorted = useMemo(() => {
    const cmp = (a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const sign = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'subscription_amount' || sortKey === 'family_members') {
        return sign * (Number(av) - Number(bv))
      }
      if (sortKey === 'created_at') {
        return sign * (new Date(av).getTime() - new Date(bv).getTime())
      }
      return sign * String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
    }
    return [...filtered].sort(cmp)
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const totalAmount = useMemo(
    () => filtered.reduce((s, x) => s + (Number(x.subscription_amount) || 0), 0),
    [filtered],
  )

  const clearFilters = () => {
    setSearch('')
    setFilterTower('')
    setFilterUnit('')
    setFilterStatus('')
    setFilterFrom('')
    setFilterTo('')
  }

  const anyFilter = search || filterTower || filterUnit || filterStatus || filterFrom || filterTo

  const pendingCount = useMemo(
    () => subscriptions.filter((s) => !s.is_verified).length,
    [subscriptions],
  )

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hero mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-indigo-300/40 blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-4 w-32 h-32 motif-dots rounded-full opacity-40 animate-spin-slow pointer-events-none" />
        <div className="relative">
          <p className="text-saffron-700 font-semibold text-xs uppercase tracking-[0.2em] mb-2 inline-flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" /> Residents Annual
          </p>
          <h1 className="display-title text-4xl md:text-5xl">
            Subscriptions
          </h1>
          <p className="muted mt-2 text-base">
            Contribution towards Welfare Committee for FY 2026-27.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button onClick={handleDownload} disabled={downloading} className="btn btn-indigo">
              <Download className="w-4 h-4" />
              {downloading ? 'Preparing…' : 'Export Excel'}
            </button>
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className={showForm ? 'btn btn-secondary' : 'btn btn-primary'}
          >
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add subscription</>}
          </button>
        </div>
      </motion.div>

      {/* Form + UPI panel side-by-side */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mb-8">
            <form onSubmit={handleSubmit} className="card-elevated space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Full Name" required>
                  <input className="input-field" required value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })} />
                </Field>
                <Field label="Contact Number" required>
                  <input type="tel" className="input-field" required value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} />
                </Field>
                <Field label="Email" required>
                  <input type="email" className="input-field" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </Field>
                <Field label="Tower" required>
                  <select className="input-field" required value={formData.tower}
                    onChange={(e) => setFormData({ ...formData, tower: e.target.value })}>
                    <option value="">Select tower</option>
                    {TOWERS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Unit Number" required>
                  <select className="input-field" required value={formData.unit_number}
                    onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}>
                    <option value="">Select unit</option>
                    {UNIT_NUMBERS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>
                <Field label="Subscription Amount (₹)" required>
                  <input type="number" min="1" className="input-field" required value={formData.subscription_amount}
                    onChange={(e) => setFormData({ ...formData, subscription_amount: e.target.value })} />
                </Field>
                <Field label="Number of Family Members">
                  <input type="number" min="0" className="input-field" value={formData.family_members}
                    onChange={(e) => setFormData({ ...formData, family_members: e.target.value })} />
                </Field>
                <Field label="Is this a rented flat?" required>
                  <select className="input-field" required value={formData.is_rented}
                    onChange={(e) => setFormData({ ...formData, is_rented: e.target.value })}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-900">Payment</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Payment method" required>
                    <select
                      className="input-field"
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    >
                      <option value="upi">UPI (online)</option>
                      <option value="cash">Cash (in-person)</option>
                    </select>
                  </Field>
                  {formData.payment_method === 'upi' && (
                    <>
                      <Field label="UPI Txn ID / UTR (optional)">
                        <input
                          className="input-field font-mono"
                          maxLength={64}
                          value={formData.txn_reference}
                          onChange={(e) => setFormData({ ...formData, txn_reference: e.target.value })}
                          placeholder="e.g. 412345678901"
                        />
                      </Field>
                      <Field label="Your UPI ID (optional)">
                        <input
                          className="input-field font-mono"
                          maxLength={128}
                          value={formData.payer_upi_id}
                          onChange={(e) => setFormData({ ...formData, payer_upi_id: e.target.value })}
                          placeholder="e.g. yourname@oksbi"
                        />
                      </Field>
                    </>
                  )}
                </div>
                <p className="text-xs text-amber-800">
                  {formData.payment_method === 'upi'
                    ? 'Pay via the UPI QR on the right. Transaction ID is optional — admin can reconcile manually.'
                    : 'You\'ll pay the committee in cash. Submit below — record stays "Pending Verification" until admin confirms receipt.'}
                </p>
              </div>

              <AnimatePresence>
                {formData.is_rented === 'Yes' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                      <p className="text-sm font-semibold text-indigo-800">
                        Property owner details <span className="text-indigo-500 font-normal">(optional)</span>
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Owner Name">
                          <input className="input-field" value={formData.landlord_name}
                            onChange={(e) => setFormData({ ...formData, landlord_name: e.target.value })} />
                        </Field>
                        <Field label="Owner Contact Number">
                          <input type="tel" className="input-field" value={formData.landlord_contact}
                            onChange={(e) => setFormData({ ...formData, landlord_contact: e.target.value })} />
                        </Field>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  <Sparkles className="w-4 h-4" />
                  {submitting ? 'Saving…' : 'Save subscription'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>

            <div className="lg:sticky lg:top-24 self-start">
              <UpiPaymentPanel
                amount={Number(formData.subscription_amount) || 0}
                note={
                  formData.tower && formData.unit_number
                    ? `Welfare FY26-27 ${formData.tower}-${formData.unit_number}`
                    : 'Welfare FY26-27'
                }
                title="Pay via UPI"
                subtitle="Scan with any UPI app, then submit your subscription."
              />
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatPill label="Records" value={filtered.length} icon={Users} accent="bg-saffron-grad" />
        <StatPill label="Total amount" value={fmtINR(totalAmount)} icon={CreditCard} accent="bg-emerald-grad" />
        <StatPill label="Pending verification" value={pendingCount} icon={Clock} accent="bg-rose-500" />
        <StatPill label="Verified" value={subscriptions.length - pendingCount} icon={ShieldCheck} accent="bg-indigo-grad" />
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field" value={filterTower} onChange={(e) => setFilterTower(e.target.value)}>
            <option value="">All towers</option>
            {TOWERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="input-field" value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
            <option value="">All units</option>
            {UNIT_NUMBERS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending verification</option>
            <option value="verified">Verified</option>
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
          <div className="w-14 h-14 rounded-2xl bg-saffron-50 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-saffron-600" />
          </div>
          <p className="font-display text-xl font-semibold text-ink-900">
            {anyFilter ? 'No subscriptions match' : 'No subscriptions yet'}
          </p>
          <p className="muted mt-1">
            {anyFilter ? 'Try clearing some filters.' : 'Click "Add subscription" to record the first one.'}
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-600 border-b border-ink-100 bg-ink-50/40">
                <Th label="Full Name"   k="owner_name"          sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('owner_name')} />
                <Th label="Tower"       k="tower"               sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('tower')} />
                <Th label="Unit"        k="unit_number"         sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('unit_number')} />
                <Th label="Amount"      k="subscription_amount" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('subscription_amount')} />
                <Th label="Family"      k="family_members"      sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('family_members')} />
                <Th label="Rented"      k="is_rented"           sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('is_rented')} />
                <Th label="Contact"     k="contact_number"      sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('contact_number')} />
                <Th label="Email"       k="email"               sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('email')} />
                <Th label="Subscribed"  k="created_at"          sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('created_at')} />
                <Th label="Status"      k="is_verified"         sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('is_verified')} />
                {isAdmin && <th className="px-4 py-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, idx) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                  className="border-b border-ink-100 hover:bg-saffron-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {s.owner_name}
                    {s.is_rented && s.landlord_name && (
                      <p className="text-xs text-ink-500 mt-0.5">Owner: {s.landlord_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">{s.tower || '—'}</td>
                  <td className="px-4 py-3 font-mono">{s.unit_number}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{fmtINR(s.subscription_amount)}</td>
                  <td className="px-4 py-3">{s.family_members}</td>
                  <td className="px-4 py-3">
                    {s.is_rented
                      ? <span className="badge badge-amber">Rented</span>
                      : <span className="badge badge-blue">Owned</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-700">{s.contact_number}</td>
                  <td className="px-4 py-3 text-ink-700 truncate max-w-[180px]" title={s.email}>{s.email}</td>
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {s.is_verified ? (
                      <span className="badge badge-green inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="badge badge-amber inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Verification by Admin
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {s.is_verified ? (
                          <button
                            onClick={() => handleVerify(s)}
                            disabled={verifyingId === s.id}
                            className="btn-ghost text-rose-600 hover:bg-rose-50"
                          >
                            {verifyingId === s.id ? 'Updating…' : 'Unverify'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(s)}
                            disabled={verifyingId === s.id}
                            className="btn btn-emerald !px-3 !py-1.5 !text-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {verifyingId === s.id ? 'Verifying…' : 'Verify'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
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
