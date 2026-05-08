import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Megaphone,
  CreditCard,
  HeartHandshake,
  Receipt,
  UtensilsCrossed,
  PieChart,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'

import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'

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

        <div className="relative grid md:grid-cols-[1.6fr_1fr] gap-8 items-center">
          <div>
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
              <Link to="/coupons" className="btn btn-secondary">
                <UtensilsCrossed className="w-4 h-4" /> Book food coupons
              </Link>
            </div>
          </div>

          {/* Stat strip */}
          <div className="grid grid-cols-3 gap-3">
            <HeroStat label="Active sections" value={filteredTiles.length} accent="bg-saffron-grad" />
            <HeroStat label="Your role" value={role || '—'} accent="bg-indigo-grad" />
            <HeroStat label="Year" value="26-27" accent="bg-emerald-grad" />
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
    </div>
  )
}

const HeroStat = ({ label, value, accent }) => (
  <div className="rounded-2xl bg-white border border-ink-100 p-3 shadow-soft relative overflow-hidden">
    <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
    <p className="text-[10px] uppercase tracking-[0.16em] text-ink-400 font-semibold mt-1">{label}</p>
    <p className="font-display text-xl font-semibold text-ink-900 capitalize mt-0.5">{value}</p>
  </div>
)
