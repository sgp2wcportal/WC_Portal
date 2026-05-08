import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Megaphone,
  UtensilsCrossed,
  HeartHandshake,
} from 'lucide-react'

import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

const highlights = [
  { icon: Megaphone,       text: 'Live announcements ticker' },
  { icon: UtensilsCrossed, text: 'Festive food coupons & QR check-in' },
  { icon: HeartHandshake,  text: 'Donations · Subscriptions · Treasury' },
  { icon: ShieldCheck,     text: 'Role-aware access for residents & admins' },
]

export const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await authService.login(username, password)
      const { access_token, role } = response.data
      setAuth(access_token, role, username)
      toast.success(`Welcome back, ${username}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-saffron-300/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[460px] h-[460px] rounded-full bg-indigo-300/30 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-emerald-300/20 blur-3xl pointer-events-none animate-floaty" />

      <div className="relative grid lg:grid-cols-2 min-h-screen">
        {/* Left — brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-saffron-grad shadow-glow flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-semibold text-ink-900 text-lg tracking-tight">
                Siddha Galaxia
              </p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-400">
                Phase 2 · Welfare Portal
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <p className="text-saffron-700 font-semibold text-sm uppercase tracking-[0.18em] mb-4">
              ✦ Welfare Committee 2026-27
            </p>
            <h1 className="font-display text-5xl xl:text-6xl font-semibold text-ink-900 leading-[1.05] tracking-tight text-balance">
              Your community,{' '}
              <span className="gradient-text italic">beautifully</span>{' '}
              organised.
            </h1>
            <p className="mt-6 text-lg text-ink-600 max-w-md text-balance">
              Connecting residents through one unified platform for celebrations,
              communication, subscriptions, and community services.
            </p>

            <ul className="mt-10 space-y-3">
              {highlights.map((h, i) => {
                const Icon = h.icon
                return (
                  <motion.li
                    key={h.text}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-center gap-3 text-ink-700"
                  >
                    <span className="w-9 h-9 rounded-xl bg-white shadow-sm border border-ink-100 flex items-center justify-center text-saffron-600">
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                    <span className="font-medium">{h.text}</span>
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>

          <p className="text-xs text-ink-400">
            Made with care · © 2026 Siddha Galaxia Phase 2
          </p>
        </div>

        {/* Right — form */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="w-full max-w-md"
          >
            <div className="card-elevated p-8 relative overflow-hidden">
              {/* Decorative motif */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-saffron-100 -z-0" />
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-saffron-200 -z-0" />

              <div className="relative">
                <p className="text-saffron-600 font-semibold text-xs uppercase tracking-[0.2em] mb-2">
                  Sign in
                </p>
                <h2 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
                  Namaste 🪔
                </h2>
                <p className="text-ink-600 mt-2 text-sm">
                  Welcome back to your community portal.
                </p>

                <form onSubmit={handleLogin} className="space-y-4 mt-8">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field"
                      placeholder="admin / user / generic"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input-field pr-12"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-700 rounded-md"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full mt-2 group"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Sign in
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-ink-600 mt-5">
                  New resident?{' '}
                  <Link to="/signup" className="text-saffron-700 font-semibold hover:text-saffron-800">
                    Create your account
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
