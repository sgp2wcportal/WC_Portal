import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone,
  CreditCard,
  HeartHandshake,
  Receipt,
  UtensilsCrossed,
  PieChart,
  ArrowUpRight,
  Sparkles,
  CalendarRange,
  AlertTriangle,
  Trash2,
  Database,
  Download,
  UserCheck,
  Clock,
  CheckCircle2,
  Phone,
  Music2,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import api from '../services/api'

const tiles = [
  {
    path: '/announcements',
    title: 'Announcements',
    description: 'Latest Updates from Siddha Galaxia Phase II — Welfare Committee',
    icon: Megaphone,
    accent: 'from-saffron-400 to-saffron-600',
    glow: 'shadow-glow',
    roles: ['admin', 'user', 'generic'],
  },
  {
    path: '/events',
    title: 'Events Calendar',
    description: 'Pujas, get-togethers & community events month by month',
    icon: CalendarRange,
    accent: 'from-orange-400 to-rose-500',
    glow: 'shadow-glow',
    roles: ['admin', 'user', 'generic'],
  },
  {
    path: '/subscriptions',
    title: 'Subscriptions',
    description: 'Pay your Subscription for FY 2026-27',
    icon: CreditCard,
    accent: 'from-indigo-400 to-indigo-600',
    glow: 'shadow-glowIndigo',
    roles: ['admin', 'user', 'generic'],
  },
  {
    path: '/donations',
    title: 'Donations',
    description: 'Contribute to society causes',
    icon: HeartHandshake,
    accent: 'from-rose-400 to-rose-600',
    glow: '',
    roles: ['admin', 'user', 'generic'],
  },
  {
    path: '/expenses',
    title: 'Expenses',
    description: 'Society expense tracking',
    icon: Receipt,
    accent: 'from-fuchsia-400 to-purple-600',
    glow: '',
    roles: ['admin', 'generic'],
  },
  {
    path: '/coupons',
    title: 'Food Coupons',
    description: 'Festive meal booking & QR check-in',
    icon: UtensilsCrossed,
    accent: 'from-emerald-400 to-emerald-600',
    glow: 'shadow-glowEmerald',
    roles: ['admin', 'user', 'generic'],
  },
  {
    path: '/treasury',
    title: 'Treasury',
    description: 'Financial analytics & reports',
    icon: PieChart,
    accent: 'from-teal-400 to-cyan-600',
    glow: '',
    roles: ['admin', 'generic'],
  },
  {
    path: '/contacts',
    title: 'Contacts',
    description: 'Committee, maintenance & emergency contacts',
    icon: Phone,
    accent: 'from-sky-400 to-blue-600',
    glow: '',
    roles: ['admin', 'user', 'generic'],
  },
  {
    path: '/cultural',
    title: 'Cultural Events',
    description: 'Register for the cultural programme',
    icon: Music2,
    accent: 'from-violet-400 to-purple-600',
    glow: '',
    roles: ['admin', 'user', 'generic'],
  },
]

const greeting = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

const TileCard = ({ tile, index }) => {
  const Icon = tile.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <Link to={tile.path} className="tile group">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tile.accent} ${tile.glow} flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" strokeWidth={2.2} />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-xl font-semibold text-ink-900 tracking-tight">
            {tile.title}
          </h3>
          <p className="text-sm text-ink-600 mt-1">{tile.description}</p>
        </div>
        <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-ink-50 group-hover:bg-saffron-100 flex items-center justify-center transition-all">
          <ArrowUpRight className="w-4 h-4 text-ink-600 group-hover:text-saffron-700 group-hover:rotate-12 transition-all" strokeWidth={2.2} />
        </div>
      </Link>
    </motion.div>
  )
}

export const DashboardPage = () => {
  const { username, role } = useAuthStore()
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('display_name') || '')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetting, setResetting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [pendingUsers, setPendingUsers] = useState([])
  const [verifyingId, setVerifyingId] = useState(null)

  const loadPendingUsers = async () => {
    if (role !== 'admin') return
    try {
      const res = await api.get('/admin/pending-users')
      setPendingUsers(res.data)
    } catch {
      // silently ignore — non-critical
    }
  }

  const handleVerifyUser = async (userId) => {
    setVerifyingId(userId)
    try {
      await api.post(`/admin/verify-user/${userId}`)
      toast.success('Account verified — approval email sent to resident.')
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      toast.error('Verification failed. Please try again.')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleBackupDownload = () => {
    setBackingUp(true)
    const token = localStorage.getItem('token')
    const a = document.createElement('a')
    a.href = `/api/admin/backup/download?token=${encodeURIComponent(token)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => setBackingUp(false), 2500)
  }

  const handleMasterReset = async () => {
    setResetting(true)
    try {
      await api.post('/admin/reset-all')
      toast.success('All transaction records deleted.')
      setShowResetModal(false)
      setResetConfirm('')
    } catch {
      toast.error('Reset failed. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    authService.getMe()
      .then((r) => {
        if (cancelled) return
        const name = (r.data?.name || '').trim()
        if (name) {
          setDisplayName(name)
          localStorage.setItem('display_name', name)
        }
      })
      .catch(() => { /* keep cached / fall back to username */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    loadPendingUsers()
  }, [role])

  const greetingTarget = displayName || username || 'friend'
  const filteredTiles = tiles.filter((tile) => tile.roles.includes(role))

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-hero mb-8 md:mb-10"
      >
        <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-saffron-200/50 blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-4 w-40 h-40 motif-dots rounded-full opacity-40 animate-spin-slow pointer-events-none" />

        <div className="relative">
          <p className="text-saffron-700 font-semibold text-xs uppercase tracking-[0.2em] mb-2 inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> {today}
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-ink-900 leading-[1.1] tracking-tight text-balance">
            {greeting()},{' '}
            <span className="gradient-text italic">{greetingTarget}</span>
            .
          </h1>
          <p className="mt-4 text-lg text-ink-600 max-w-xl text-balance">
            Here's everything happening at Siddha Galaxia Phase 2 today.
            Pick a section below to get started.
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            <Link to="/announcements" className="btn btn-primary">
              <Megaphone className="w-4 h-4" /> See announcements
            </Link>
            <Link to="/events" className="btn btn-secondary">
              <CalendarRange className="w-4 h-4" /> View Events Calendar
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="flex items-baseline justify-between mb-5">
        <h2 className="section-title">Quick actions</h2>
        <p className="muted">Tap a card to jump in</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTiles.map((tile, idx) => (
          <TileCard key={tile.path} tile={tile} index={idx} />
        ))}
      </div>

      {role === 'admin' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 border border-indigo-200 rounded-2xl p-6 bg-indigo-50/50"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <h2 className="font-display text-lg font-semibold text-indigo-800">Pending Verifications</h2>
            </div>
            {pendingUsers.length > 0 && (
              <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </div>
          <p className="text-sm text-indigo-700 mb-4">
            New residents who have signed up and are waiting for account approval.
          </p>
          {pendingUsers.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-indigo-500">
              <CheckCircle2 className="w-4 h-4" /> All accounts verified — no pending requests.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u.id} className="bg-white border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-900 text-sm">{u.name || u.username}</p>
                    <p className="text-xs text-ink-500 mt-0.5">
                      Flat: <span className="font-medium text-ink-700">{u.tower}-{u.unit_number}</span>
                      {' · '}Contact: <span className="font-medium text-ink-700">{u.contact_number || '—'}</span>
                      {' · '}Username: <span className="font-mono text-ink-600">{u.username}</span>
                    </p>
                    {u.email && <p className="text-xs text-ink-400 mt-0.5">{u.email}</p>}
                    {u.is_rented && (
                      <p className="text-xs text-amber-600 mt-0.5">Rented · Owner: {u.owner_name || '—'} ({u.owner_contact_number || '—'})</p>
                    )}
                    <p className="text-[10px] text-ink-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {u.created_at ? new Date(u.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleVerifyUser(u.id)}
                    disabled={verifyingId === u.id}
                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 gap-2 shrink-0 disabled:opacity-60"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {verifyingId === u.id ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {role === 'admin' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-6 border border-teal-200 rounded-2xl p-6 bg-teal-50/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-5 h-5 text-teal-600 shrink-0" />
            <h2 className="font-display text-lg font-semibold text-teal-800">Database Backup</h2>
          </div>
          <p className="text-sm text-teal-700 mb-4">
            Download a complete snapshot of the database. Save this file locally — it can be used to fully restore all society data if the live database is ever corrupted or lost.
          </p>
          <button
            onClick={handleBackupDownload}
            disabled={backingUp}
            className="btn bg-teal-600 hover:bg-teal-700 text-white border-teal-700 gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {backingUp ? 'Preparing backup…' : 'Download Backup'}
          </button>
        </motion.div>
      )}

      {role === 'admin' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 border border-rose-200 rounded-2xl p-6 bg-rose-50/50"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <h2 className="font-display text-lg font-semibold text-rose-800">Danger Zone</h2>
          </div>
          <p className="text-sm text-rose-700 mb-4">
            Master reset permanently deletes <strong>all</strong> subscriptions, donations, expenses, and food coupon records.
            Use this only to wipe test data before going live.
          </p>
          <button
            onClick={() => { setShowResetModal(true); setResetConfirm('') }}
            className="btn bg-rose-600 hover:bg-rose-700 text-white border-rose-700 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Master Reset
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showResetModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResetModal(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
              className="bg-white rounded-2xl shadow-[0_30px_80px_-25px_rgba(28,25,23,0.4)] border border-rose-200 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-rose-900">Master Reset</h3>
                  <p className="text-sm text-rose-600">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-sm text-ink-700">
                This will permanently delete <strong>all</strong> records for:
              </p>
              <ul className="text-sm text-ink-700 list-disc list-inside space-y-1 pl-1">
                <li>Subscriptions</li>
                <li>Donations</li>
                <li>Expenses</li>
                <li>Food Coupons &amp; Tickets</li>
              </ul>

              <div>
                <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                  Type <span className="font-mono text-rose-600">RESET</span> to confirm
                </label>
                <input
                  className="input-field"
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder="RESET"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleMasterReset}
                  disabled={resetConfirm !== 'RESET' || resetting}
                  className="btn bg-rose-600 hover:bg-rose-700 text-white border-rose-700 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {resetting ? 'Deleting…' : 'Delete everything'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

