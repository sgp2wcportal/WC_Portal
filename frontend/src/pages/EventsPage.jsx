import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  CalendarRange,
  Plus,
  X,
  Sparkles,
  Filter,
  Pencil,
  Trash2,
  Image as ImageIcon,
  CalendarDays,
} from 'lucide-react'

import { eventService } from '../services/eventService'
import { storageUrl } from '../services/couponService'
import { useAuthStore } from '../store/authStore'
import { RichTextEditor } from '../components/RichTextEditor'
import { SafeHtml } from '../components/SafeHtml'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const fmtDate = (raw) => {
  if (!raw) return '—'
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw + 'Z'
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

const monthKey = (raw) => {
  if (!raw) return '0000-00'
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw + 'Z'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (key) => {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

const Field = ({ label, required, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
    {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
  </label>
)

const emptyForm = {
  title: '',
  description: '',
  start_date: '',
  end_date: '',
}

const toIsoOrNull = (yyyymmdd, endOfDay = false) => {
  if (!yyyymmdd) return null
  const time = endOfDay ? 'T23:59:59' : 'T00:00:00'
  return new Date(yyyymmdd + time).toISOString()
}

export const EventsPage = () => {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'admin' || role === 'generic'

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)        // null | 'new' | event
  const [filterMonth, setFilterMonth] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const r = await eventService.listEvents()
      setEvents(r.data)
    } catch {
      toast.error('Could not load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const monthsAvailable = useMemo(() => {
    const set = new Set(events.map((e) => monthKey(e.start_date)))
    return Array.from(set).sort().reverse()
  }, [events])

  const filtered = useMemo(() => {
    if (!filterMonth) return events
    return events.filter((e) => monthKey(e.start_date) === filterMonth)
  }, [events, filterMonth])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const e of filtered) {
      const key = monthKey(e.start_date)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(e)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const handleDelete = (event) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 min-w-[260px]">
          <p className="font-semibold text-ink-900">Delete "{event.title}"?</p>
          <p className="text-xs text-ink-600">This cannot be undone.</p>
          <div className="flex gap-2 mt-1">
            <button
              className="btn btn-danger flex-1 py-1.5 text-xs"
              onClick={async () => {
                toast.dismiss(t.id)
                try {
                  await eventService.deleteEvent(event.id)
                  setEvents((prev) => prev.filter((e) => e.id !== event.id))
                  toast.success('Event deleted')
                } catch {
                  toast.error('Could not delete event')
                }
              }}
            >
              Delete
            </button>
            <button
              className="btn btn-secondary flex-1 py-1.5 text-xs"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 8000 },
    )
  }

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
            <CalendarRange className="w-3.5 h-3.5" /> What's coming up
          </p>
          <h1 className="display-title text-4xl md:text-5xl">
            Events <span className="gradient-text italic">Calendar</span>
          </h1>
          <p className="muted mt-2 text-base">
            Pujas, get-togethers, and welfare-committee meetups — month by month.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setEditing('new')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" /> Add event
          </button>
        )}
      </motion.div>

      {/* Filter */}
      <div className="card mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-ink-600" />
          <p className="font-semibold text-sm text-ink-800">Sort by month</p>
        </div>
        <select
          className="input-field !w-auto"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">All months</option>
          {monthsAvailable.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
        {filterMonth && (
          <button onClick={() => setFilterMonth('')} className="text-xs text-saffron-700 hover:text-saffron-800 font-semibold">
            Clear
          </button>
        )}
      </div>

      {/* Editor (admin only) */}
      <AnimatePresence>
        {editing && isAdmin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <EventForm
              initial={editing === 'new' ? null : editing}
              onCancel={() => setEditing(null)}
              onSaved={async () => {
                await fetchAll()
                setEditing(null)
                toast.success(editing === 'new' ? 'Event created' : 'Event updated')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => <div key={i} className="card h-72 skeleton" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="card-elevated text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="w-6 h-6 text-rose-600" />
          </div>
          <p className="font-display text-xl font-semibold text-ink-900">
            {filterMonth ? 'No events that month' : 'No events yet'}
          </p>
          <p className="muted mt-1">
            {filterMonth
              ? 'Pick another month or clear the filter.'
              : isAdmin
                ? 'Click "Add event" to create the first one.'
                : 'When the committee schedules something, it will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([key, list], gi) => (
            <section key={key}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="display-title text-2xl">{monthLabel(key)}</h2>
                <p className="muted text-xs">
                  {list.length} event{list.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {list.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * (gi * 3 + idx) }}
                  >
                    <EventTile
                      event={event}
                      isAdmin={isAdmin}
                      onEdit={() => setEditing(event)}
                      onDelete={() => handleDelete(event)}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

const EventTile = ({ event, isAdmin, onEdit, onDelete }) => {
  const start = fmtDate(event.start_date)
  const end = event.end_date ? fmtDate(event.end_date) : null
  const dateLabel = end && end !== start ? `${start} → ${end}` : start
  const img = storageUrl(event.image)

  return (
    <article className="card-elevated overflow-hidden p-0 flex flex-col group">
      {img ? (
        <img src={img} alt={event.title} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-saffron-100 via-rose-100 to-indigo-100 flex items-center justify-center text-saffron-700">
          <ImageIcon className="w-10 h-10 opacity-60" />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs font-semibold text-saffron-700 uppercase tracking-[0.15em] inline-flex items-center gap-1.5">
          <CalendarRange className="w-3.5 h-3.5" />
          {dateLabel}
        </p>
        <h3 className="font-display text-xl font-semibold text-ink-900 leading-snug mt-1.5">
          {event.title}
        </h3>
        {event.description && (
          <SafeHtml html={event.description} className="text-sm text-ink-700 mt-2 line-clamp-4" />
        )}
        {isAdmin && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-ink-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="btn-ghost text-xs">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onDelete} className="btn-ghost text-xs text-rose-600 hover:bg-rose-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

const isoToInputDate = (iso) => {
  if (!iso) return ''
  const raw = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z'
  return new Date(raw).toISOString().slice(0, 10)
}

const EventForm = ({ initial, onCancel, onSaved }) => {
  const [form, setForm] = useState(() => {
    if (!initial) return { ...emptyForm }
    return {
      title: initial.title || '',
      description: initial.description || '',
      start_date: isoToInputDate(initial.start_date),
      end_date: isoToInputDate(initial.end_date),
    }
  })
  const [busy, setBusy] = useState(false)
  const [pendingImage, setPendingImage] = useState(null)
  const fileRef = useRef(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.start_date) {
      toast.error('Pick a start date')
      return
    }
    if (form.end_date && form.end_date < form.start_date) {
      toast.error('End date cannot be before start date')
      return
    }
    setBusy(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description,
        start_date: toIsoOrNull(form.start_date),
        end_date: form.end_date ? toIsoOrNull(form.end_date, true) : null,
      }
      let event
      if (initial?.id) {
        const r = await eventService.updateEvent(initial.id, payload)
        event = r.data
      } else {
        const r = await eventService.createEvent(payload)
        event = r.data
      }
      if (pendingImage) {
        await eventService.uploadImage(event.id, pendingImage)
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not save event')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-elevated space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-ink-900">
            {initial?.id ? 'Edit event' : 'New event'}
          </h3>
          <p className="muted">All residents will see this on the Events Calendar.</p>
        </div>
        <button type="button" className="btn-ghost" onClick={onCancel} aria-label="Close form">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Event Title" required>
          <input
            className="input-field"
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Durga Puja Pushpanjali 2026"
          />
        </Field>
        <Field label="Event Picture (tile image)" hint="JPG/PNG. Optional but makes the tile look great.">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn btn-secondary !py-2"
            >
              <ImageIcon className="w-4 h-4" />
              {pendingImage ? 'Change image' : (initial?.image ? 'Replace image' : 'Pick image')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setPendingImage(e.target.files?.[0] || null)}
            />
            <span className="text-xs text-ink-500 truncate">
              {pendingImage ? pendingImage.name : (initial?.image ? 'Existing image kept' : 'No file selected')}
            </span>
          </div>
        </Field>
        <Field label="Start Date" required>
          <input
            type="date"
            className="input-field"
            required
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </Field>
        <Field label="End Date" hint="Leave blank for a single-day event.">
          <input
            type="date"
            className="input-field"
            value={form.end_date}
            min={form.start_date || undefined}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Event Description" hint="Use the toolbar for fonts, colour, headings, lists, alignment.">
        <RichTextEditor
          value={form.description}
          onChange={(html) => setForm({ ...form, description: html })}
          placeholder="What is this event about? Schedule, dress code, where to gather…"
          minHeight={200}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={busy} className="btn btn-primary">
          <Sparkles className="w-4 h-4" />
          {busy ? 'Saving…' : (initial?.id ? 'Save changes' : 'Create event')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
