import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus,
  X,
  Search,
  HeartHandshake,
  Sparkles,
  Filter,
  ArrowUpDown,
  ChevronDown,
  TrendingUp,
  ShieldCheck,
  Clock,
  Download,
  Trash2,
} from 'lucide-react'

import { donationService } from '../services/donationService'
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
  donor_name: '',
  donor_email: '',
  donor_phone: '',
  tower: '',
  unit_number: '',
  amount: '',
  donation_type: 'Donation',
  description: '',
  payment_method: 'upi',
  txn_reference: '',
  payer_upi_id: '',
}

export const DonationsPage = () => {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'admin' || role === 'generic'

  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [verifyingId, setVerifyingId] = useState(null)
  const [downloading, setDownloading] = useState(false)

  const [search, setSearch] = useState('')
  const [filterTower, setFilterTower] = useState('')
  const [filterUnit, setFilterUnit] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [sortKey, setSortKey] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => { fetchDonations() }, [])

  const fetchDonations = async () => {
    try {
      const response = await donationService.getDonations()
      setDonations(response.data)
    } catch {
      toast.error('Failed to fetch donations')
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
        donor_name: formData.donor_name.trim(),
        donor_email: formData.donor_email.trim(),
        donor_phone: formData.donor_phone.trim(),
        tower: formData.tower,
        unit_number: formData.unit_number,
        amount: Number(formData.amount),
        donation_type: formData.donation_type,
        description: formData.description.trim(),
        payment_method: formData.payment_method,
        txn_reference: isUpi ? (formData.txn_reference.trim() || null) : null,
        payer_upi_id: isUpi ? (formData.payer_upi_id.trim() || null) : null,
      }
      await donationService.createDonation(payload)
      setFormData(emptyForm)
      setShowForm(false)
      toast.success('Donation recorded — thank you!')
      fetchDonations()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create donation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const r = await donationService.exportExcel()
      triggerDownload(r, 'donations.xlsx')
      toast.success('Excel downloaded')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleVerify = async (don) => {
    setVerifyingId(don.id)
    try {
      const r = await donationService.verify(don.id, !don.is_verified)
      setDonations((prev) => prev.map((d) => (d.id === don.id ? r.data : d)))
      toast.success(r.data.is_verified ? 'Marked as verified' : 'Verification removed')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update verification')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleDelete = (don) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 min-w-[240px]">
          <p className="font-semibold text-ink-900">Delete this donation?</p>
          <p className="text-xs text-ink-600">{don.donor_name} — {don.donation_type}</p>
          <p className="text-xs text-rose-600 font-medium">This cannot be undone.</p>
          <div className="flex gap-2 mt-1">
            <button className="btn btn-danger flex-1 py-1.5 text-xs" onClick={async () => {
              toast.dismiss(t.id)
              try {
                await donationService.deleteDonation(don.id)
                setDonations((prev) => prev.filter((d) => d.id !== don.id))
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
    return donations.filter((d) => {
      if (filterTower && d.tower !== filterTower) return false
      if (filterUnit && d.unit_number !== filterUnit) return false
      if (filterType && d.donation_type !== filterType) return false
      if (filterStatus === 'verified' && !d.is_verified) return false
      if (filterStatus === 'pending' && d.is_verified) return false
      if (q && !(d.donor_name || '').toLowerCase().includes(q)) return false
      if (filterFrom) {
        const ts = new Date(d.created_at)
        if (ts < new Date(filterFrom + 'T00:00:00')) return false
      }
      if (filterTo) {
        const ts = new Date(d.created_at)
        if (ts > new Date(filterTo + 'T23:59:59')) return false
      }
      return true
    })
  }, [donations, search, filterTower, filterUnit, filterType, filterStatus, filterFrom, filterTo])

  const sorted = useMemo(() => {
    const cmp = (a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const sign = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'amount') return sign * (Number(av) - Number(bv))
      if (sortKey === 'created_at') return sign * (new Date(av).getTime() - new Date(bv).getTime())
      return sign * String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
    }
    return [...filtered].sort(cmp)
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const totalAmount = useMemo(
    () => filtered.reduce((s, x) => s + (Number(x.amount) || 0), 0),
    [filtered],
  )

  const types = useMemo(
    () => Array.from(new Set(donations.map((d) => d.donation_type).filter(Boolean))),
    [donations],
  )

  const clearFilters = () => {
    setSearch('')
    setFilterTower('')
    setFilterUnit('')
    setFilterType('')
    setFilterStatus('')
    setFilterFrom('')
    setFilterTo('')
  }

  const anyFilter = search || filterTower || filterUnit || filterType || filterStatus || filterFrom || filterTo

  const pendingCount = useMemo(
    () => donations.filter((d) => !d.is_verified).length,
    [donations],
  )

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
            <HeartHandshake className="w-3.5 h-3.5" /> Generosity
          </p>
          <h1 className="display-title text-4xl md:text-5xl">
            Donations <span className="gradient-text italic">& Sponsorships</span>
          </h1>
          <p className="muted mt-2 text-base">
            Record and track contributions from residents and well-wishers.
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
            {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Record donation</>}
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
                  <input className="input-field" required value={formData.donor_name}
                    onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })} />
                </Field>
                <Field label="Email ID" required>
                  <input type="email" className="input-field" required value={formData.donor_email}
                    onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })} />
                </Field>
                <Field label="Contact Number" required>
                  <input type="tel" className="input-field" required value={formData.donor_phone}
                    onChange={(e) => setFormData({ ...formData, donor_phone: e.target.value })} />
                </Field>
                <Field label="Amount (₹)" required>
                  <input type="number" min="1" className="input-field" required value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
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
                <Field label="Type" required>
                  <select className="input-field" value={formData.donation_type}
                    onChange={(e) => setFormData({ ...formData, donation_type: e.target.value })}>
                    <option>Donation</option>
                    <option>Sponsorship</option>
                    <option>Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Description">
                <textarea className="input-field h-20" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional note — purpose, occasion, etc."
                />
              </Field>

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
                    : 'You\'ll pay the committee in cash. Record stays "Pending Verification" until admin confirms receipt.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  <Sparkles className="w-4 h-4" />
                  {submitting ? 'Saving…' : 'Record donation'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>

            <div className="lg:sticky lg:top-24 self-start">
              <UpiPaymentPanel
                amount={Number(formData.amount) || 0}
                note={
                  formData.tower && formData.unit_number
                    ? `${formData.donation_type} ${formData.tower}-${formData.unit_number}`
                    : formData.donation_type || 'Donation'
                }
                title="Pay via UPI"
                subtitle="Scan with any UPI app, then submit your contribution."
              />
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatPill label="Records" value={filtered.length} icon={HeartHandshake} accent="bg-rose-500" />
        <StatPill label="Total raised" value={fmtINR(totalAmount)} icon={TrendingUp} accent="bg-emerald-grad" />
        <StatPill label="Pending verification" value={pendingCount} icon={Clock} accent="bg-saffron-grad" />
        <StatPill label="Verified" value={donations.length - pendingCount} icon={ShieldCheck} accent="bg-indigo-grad" />
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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
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
          <select className="input-field" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
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
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <HeartHandshake className="w-6 h-6 text-rose-600" />
          </div>
          <p className="font-display text-xl font-semibold text-ink-900">
            {anyFilter ? 'No donations match' : 'No donations recorded yet'}
          </p>
          <p className="muted mt-1">
            {anyFilter ? 'Try clearing some filters.' : 'Click "Record donation" to log the first one.'}
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-600 border-b border-ink-100 bg-ink-50/40">
                <Th label="Full Name"      k="donor_name"     sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('donor_name')} />
                <Th label="Tower"          k="tower"          sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('tower')} />
                <Th label="Unit"           k="unit_number"    sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('unit_number')} />
                <Th label="Type"           k="donation_type"  sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('donation_type')} />
                <Th label="Amount"         k="amount"         sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('amount')} />
                <Th label="Email"          k="donor_email"    sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('donor_email')} />
                <Th label="Contact"        k="donor_phone"    sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('donor_phone')} />
                <Th label="Date"           k="created_at"     sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('created_at')} />
                <Th label="Status"         k="is_verified"    sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('is_verified')} />
                {isAdmin && <th className="px-4 py-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map((d, idx) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.015 }}
                  className="border-b border-ink-100 hover:bg-saffron-50/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {d.donor_name}
                    {d.description && (
                      <p className="text-xs text-ink-500 mt-0.5 truncate max-w-[260px]" title={d.description}>
                        {d.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{d.tower || '—'}</td>
                  <td className="px-4 py-3 font-mono">{d.unit_number || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      d.donation_type === 'Sponsorship' ? 'badge-blue' :
                      d.donation_type === 'Donation' ? 'badge-amber' : 'badge-green'
                    }`}>
                      {d.donation_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{fmtINR(d.amount)}</td>
                  <td className="px-4 py-3 text-ink-700 truncate max-w-[180px]" title={d.donor_email}>{d.donor_email}</td>
                  <td className="px-4 py-3 text-ink-700">{d.donor_phone}</td>
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{fmtDate(d.created_at)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.is_verified ? (
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
                        {d.is_verified ? (
                          <button
                            onClick={() => handleVerify(d)}
                            disabled={verifyingId === d.id}
                            className="btn-ghost text-rose-600 hover:bg-rose-50"
                          >
                            {verifyingId === d.id ? 'Updating…' : 'Unverify'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(d)}
                            disabled={verifyingId === d.id}
                            className="btn btn-emerald !px-3 !py-1.5 !text-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {verifyingId === d.id ? 'Verifying…' : 'Verify'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(d)}
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
