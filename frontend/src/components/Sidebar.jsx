import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Megaphone,
  CreditCard,
  HeartHandshake,
  Receipt,
  UtensilsCrossed,
  PieChart,
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

export const Sidebar = () => {
  const role = useAuthStore((state) => state.role)
  const items = menuItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-ink-100 bg-white/70 backdrop-blur-xl">
      <nav className="flex-1 p-4 space-y-1">
        <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.18em] text-ink-400 font-semibold">
          Menu
        </p>
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * idx, duration: 0.25 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.4 : 2} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          )
        })}
      </nav>

    </aside>
  )
}
