import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, ChevronDown, Sparkles, ShieldCheck, User, Menu } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'

const roleLabel = {
  admin: 'Admin',
  generic: 'Committee',
  user: 'Resident',
}

const roleAccent = {
  admin: 'bg-saffron-grad',
  generic: 'bg-indigo-grad',
  user: 'bg-emerald-grad',
}

export const Header = ({ onMenuOpen }) => {
  const navigate = useNavigate()
  const { username, role, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success('Logged out — see you soon!')
    navigate('/')
  }

  const initial = (username || '?').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-saffron-100">
      <div className="px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger — mobile only, desktop uses sidebar */}
          <button
            onClick={onMenuOpen}
            aria-label="Open menu"
            className="md:hidden w-9 h-9 rounded-xl border border-ink-200 hover:border-saffron-300 hover:bg-saffron-50 flex items-center justify-center text-ink-700 transition-all"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Brand */}
          <Link to="/dashboard" className="flex items-center gap-2.5 group min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-saffron-grad shadow-glow flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-saffron-grad opacity-25 blur-md -z-10 group-hover:opacity-50 transition-opacity" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="font-display font-semibold text-ink-900 text-sm sm:text-base tracking-tight truncate">
                Siddha Galaxia Phase 2 <span className="hidden sm:inline text-saffron-600">WC</span>
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink-400 font-medium hidden sm:block">
                Welfare Committee · 2026-27
              </p>
            </div>
          </Link>
        </div>

        {/* Profile */}
        {username && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-full bg-white border border-ink-200 hover:border-saffron-300 hover:shadow-sm transition-all"
            >
              <div className={`w-7 h-7 rounded-full ${roleAccent[role] || 'bg-saffron-grad'} text-white flex items-center justify-center font-semibold text-xs shadow-sm`}>
                {initial}
              </div>
              <div className="text-left hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-ink-900">{username}</p>
                <p className="text-[11px] text-ink-400 uppercase tracking-wider">{roleLabel[role] || role}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-[0_24px_60px_-25px_rgba(6,182,212,0.25)] border border-saffron-100 p-2 origin-top-right"
                >
                  <div className="px-3 py-3 border-b border-ink-100">
                    <p className="text-sm font-semibold text-ink-900">{username}</p>
                    <p className="text-xs text-ink-600 capitalize">{roleLabel[role] || role} access</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setOpen(false); navigate('/profile') }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-saffron-50"
                    >
                      <User className="w-4 h-4" /> My profile
                    </button>
                    {role === 'admin' && (
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-saffron-50">
                        <ShieldCheck className="w-4 h-4" /> Admin panel
                      </button>
                    )}
                  </div>
                  <div className="border-t border-ink-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  )
}
