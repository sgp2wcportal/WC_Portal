import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  CalendarRange,
  UtensilsCrossed,
  MoreHorizontal,
  Megaphone,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const primaryItems = [
  { path: '/dashboard',     label: 'Home',      icon: LayoutDashboard,  roles: ['admin', 'user', 'generic'] },
  { path: '/announcements', label: 'News',       icon: Megaphone,        roles: ['admin', 'user', 'generic'] },
  { path: '/events',        label: 'Events',     icon: CalendarRange,    roles: ['admin', 'user', 'generic'] },
  { path: '/coupons',       label: 'Coupons',    icon: UtensilsCrossed,  roles: ['admin', 'user', 'generic'] },
]

export const BottomNav = ({ onMenuOpen }) => {
  const role = useAuthStore((s) => s.role)
  const items = primaryItems.filter((m) => m.roles.includes(role))

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-saffron-100 safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                  isActive ? 'text-saffron-600' : 'text-ink-400 hover:text-ink-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-pill"
                      className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-8 rounded-xl bg-saffron-100"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon
                    className={`w-5 h-5 relative z-10 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`}
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-wide relative z-10">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}

        {/* More — opens the full nav drawer */}
        <button
          onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-ink-400 hover:text-ink-600 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[9px] font-semibold uppercase tracking-wide">More</span>
        </button>
      </div>
    </nav>
  )
}
