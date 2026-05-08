import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, X } from 'lucide-react'

import { announcementService } from '../services/announcementService'

const FALLBACK = [
  '🎉 Welcome to Siddha Galaxia · Phase 2 — Welfare Committee Portal 2026-27',
  '🪔 Durga Puja meal coupon bookings open soon — keep your UPI ready',
  '💡 Spotted a bug? Tell the committee on the announcements page',
]

const isVisible = (a) => {
  if (!a.visible_until) return true
  const raw = /[zZ]|[+-]\d{2}:?\d{2}$/.test(a.visible_until)
    ? a.visible_until
    : a.visible_until + 'Z'
  return new Date(raw).getTime() >= Date.now()
}

export const MarqueeBanner = () => {
  const [items, setItems] = useState(FALLBACK)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    announcementService
      .getAnnouncements()
      .then((r) => {
        if (cancelled) return
        const live = (r.data || []).filter(isVisible).slice(0, 6)
        if (!live.length) return
        setItems(live.map((a) => `📢 ${a.title} — ${a.content.slice(0, 110)}${a.content.length > 110 ? '…' : ''}`))
      })
      .catch(() => {
        // keep fallback
      })
    return () => { cancelled = true }
  }, [])

  if (dismissed) return null

  // Duplicate so the marquee animation seamlessly loops.
  const looped = [...items, ...items]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="relative bg-saffron-grad text-white border-y border-saffron-600/30 overflow-hidden"
      >
        <div className="relative h-10 flex items-center">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-saffron-600 via-saffron-500 to-transparent z-10 flex items-center px-3 gap-2">
            <Megaphone className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold">Live</span>
          </div>
          <div className="absolute right-10 top-0 bottom-0 w-24 bg-gradient-to-l from-saffron-500 to-transparent z-10 pointer-events-none" />

          <Link to="/announcements" className="block w-full">
            <div className="marquee-track text-sm font-medium">
              {looped.map((text, i) => (
                <span key={i} className="inline-flex items-center gap-3">
                  <span className="opacity-95 hover:opacity-100">{text}</span>
                  <span className="opacity-50">•</span>
                </span>
              ))}
            </div>
          </Link>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-white/15 flex items-center justify-center z-20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
