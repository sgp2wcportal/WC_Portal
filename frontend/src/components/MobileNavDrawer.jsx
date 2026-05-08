import React, { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Megaphone,
  CreditCard,
  HeartHandshake,
  Receipt,
  UtensilsCrossed,
  PieChart,
  X,
  Sparkles,
} from 'lucide-react'

import { useAuthStore } from '../store/authStore'

const menuItems = [
  { path: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, roles: ['admin', 'user', 'generic'] },
  { path: '/announcements', label: 'Announcements', icon: Megaphone,       roles: ['admin', 'user', 'generic'] },
  { path: '/subscriptions', label: 'Subscriptions', icon: CreditCard,      roles: ['admin', 'user', 'generic'] },
  { path: '/donations',     label: 'Donations',     icon: HeartHandshake,  roles: ['admin', 'user', 'generic'] },
  { path: '/expenses',      label: 'Expenses',      icon: Receipt,         roles: ['admin', 'generic']         },
  { path: '/coupons',       label: 'Food Coupons',  icon: UtensilsCrossed, roles: ['admin', 'user', 'generic'] },
  { path: '/treasury',      label: 'Treasury',      icon: PieChart,        roles: ['admin', 'generic']         },
]

export const MobileNavDrawer = ({ open, onClose }) => {
  const role = useAuthStore((s) => s.role)
  const items = menuItems.filter((m) => m.roles.includes(role))

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-40"
          />
          <motion.aside
            key="drawer"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-[0_30px_80px_-25px_rgba(28,25,23,0.4)] flex flex-col"
          >
            <div className="px-4 py-4 flex items-center justify-between border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-saffron-grad shadow-glow flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                </div>
                <div className="leading-tight">
                  <p className="font-display font-semibold text-ink-900 text-sm tracking-tight">
                    Siddha Galaxia
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ink-400 font-medium">
                    Welfare Portal
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="w-8 h-8 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.18em] text-ink-400 font-semibold">
                Menu
              </p>
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-saffron-grad text-white shadow-glow font-semibold'
                          : 'text-ink-700 hover:bg-saffron-50 hover:text-saffron-700'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
