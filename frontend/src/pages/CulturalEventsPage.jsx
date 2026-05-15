import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Music2,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Users,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'
import { culturalService } from '../services/culturalService'

const DEFAULT_CATEGORIES = [
  'Solo Singer', 'Group Singing', 'Solo Dance', 'Group Dance', 'Acting', 'Others',
]

const CATEGORY_COLORS = {
  'Solo Singer':   'bg-violet-100 text-violet-700',
  'Group Singing': 'bg-purple-100 text-purple-700',
  'Solo Dance':    'bg-pink-100 text-pink-700',
  'Group Dance':   'bg-rose-100 text-rose-700',
  'Acting':        'bg-amber-100 text-amber-700',
  'Others':        'bg-ink-100 text-ink-600',
}

const EMPTY_FORM = {
  participant_name: '',
  tower: '',
  unit_number: '',
  contact_number: '',
  email: '',
  event_name: '',
  category: '',
  num_participants: 1,
  description: '',
}

export const CulturalEventsPage = () => {
  const { role } = useAuthStore()
  const isAdmin = role === 'admin'

  const [registrations, setRegistrations] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [regRes, catRes] = await Promise.all([
        culturalService.list(),
        culturalService.listCategories(),
      ])
      setRegistrations(regRes.data)
      setCategories(catRes.data)
    } catch {
      toast.error('Failed to load registrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return registrations.filter((r) => {
      const matchesCat = !filterCategory || r.category === filterCategory
      const matchesSearch =
        !q ||
        r.participant_name?.toLowerCase().includes(q) ||
        r.event_name?.toLowerCase().includes(q) ||
        r.tower?.toLowerCase().includes(q) ||
        r.unit_number?.toLowerCase().includes(q) ||
        r.contact_number?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [registrations, search, filterCategory])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (reg) => {
    setEditing(reg)
    setForm({
      participant_name: reg.participant_name,
      tower: reg.tower,
      unit_number: reg.unit_number,
      contact_number: reg.contact_number,
      email: reg.email || '',
      event_name: reg.event_name,
      category: reg.category,
      num_participants: reg.num_participants,
      description: reg.description || '',
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const required = ['participant_name', 'tower', 'unit_number', 'contact_number', 'event_name', 'category']
    for (const f of required) {
      if (!form[f]?.toString().trim()) {
        toast.error(`${f.replace(/_/g, ' ')} is required.`)
        return
      }
    }
    setSaving(true)
    try {
      const payload = { ...form, num_participants: Number(form.num_participants) || 1 }
      if (editing) {
        const res = await culturalService.update(editing.id, payload)
        setRegistrations((prev) => prev.map((r) => (r.id === editing.id ? res.data : r)))
        toast.success('Registration updated.')
      } else {
        const res = await culturalService.create(payload)
        setRegistrations((prev) => [res.data, ...prev])
        toast.success('Registration submitted!')
      }
      setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save registration.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await culturalService.delete(id)
      setRegistrations((prev) => prev.filter((r) => r.id !== id))
      toast.success('Registration deleted.')
    } catch {
      toast.error('Failed to delete registration.')
    } finally {
      setDeletingId(null)
    }
  }

  const setField = (f, v) => setForm((prev) => ({ ...prev, [f]: v }))

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
            Cultural Events
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            Register your performance for the cultural programme
          </p>
        </div>
        <button onClick={openAdd} className="btn btn-primary gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Register
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search by name, flat, event…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative sm:w-52">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field appearance-none pr-8"
          >
            <option value="">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
        </div>
      </div>

      {/* Stats (admin) */}
      {isAdmin && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-ink-900">{registrations.length}</p>
            <p className="text-xs text-ink-500 mt-0.5">Total registrations</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-ink-900">
              {registrations.reduce((s, r) => s + (r.num_participants || 1), 0)}
            </p>
            <p className="text-xs text-ink-500 mt-0.5">Total participants</p>
          </div>
          <div className="card p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-2xl font-bold text-ink-900">{new Set(registrations.map((r) => r.category)).size}</p>
            <p className="text-xs text-ink-500 mt-0.5">Categories</p>
          </div>
        </div>
      )}

      {/* Registrations list */}
      {loading ? (
        <div className="text-center py-16 text-ink-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-ink-400">
          {search || filterCategory ? 'No registrations match your filters.' : 'No registrations yet. Be the first to register!'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, idx) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.03 * idx }}
              className="card p-4 flex gap-4 items-start group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <Music2 className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-ink-900 text-sm">{r.participant_name}</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[r.category] || 'bg-ink-100 text-ink-600'}`}>
                    {r.category}
                  </span>
                </div>
                <p className="text-sm text-saffron-700 font-medium">{r.event_name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-ink-500">
                  <span>Flat: <b className="text-ink-700">{r.tower}-{r.unit_number}</b></span>
                  <span>Contact: <b className="text-ink-700">{r.contact_number}</b></span>
                  {r.num_participants > 1 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {r.num_participants} participants
                    </span>
                  )}
                </div>
                {r.description && <p className="text-xs text-ink-500 mt-1 italic">"{r.description}"</p>}
                {isAdmin && (
                  <p className="text-[10px] text-ink-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                    {r.created_by && ` · by ${r.created_by}`}
                  </p>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(r)}
                    className="w-7 h-7 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-400 hover:text-ink-700"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-ink-400 hover:text-rose-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Registration form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForm(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
              className="bg-white rounded-2xl shadow-[0_30px_80px_-25px_rgba(28,25,23,0.4)] border border-ink-100 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-ink-900">
                  {editing ? 'Edit Registration' : 'Register for Cultural Event'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Tower *</label>
                    <input className="input-field" value={form.tower} onChange={(e) => setField('tower', e.target.value)} placeholder="A / B / C…" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Unit No. *</label>
                    <input className="input-field" value={form.unit_number} onChange={(e) => setField('unit_number', e.target.value)} placeholder="101" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Participant Name *</label>
                  <input className="input-field" value={form.participant_name} onChange={(e) => setField('participant_name', e.target.value)} placeholder="Name of lead participant / group" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Contact No. *</label>
                    <input className="input-field" value={form.contact_number} onChange={(e) => setField('contact_number', e.target.value)} placeholder="Mobile number" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Email</label>
                    <input className="input-field" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="Optional" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Event / Programme Name *</label>
                  <input className="input-field" value={form.event_name} onChange={(e) => setField('event_name', e.target.value)} placeholder="e.g. Durga Puja Cultural Night 2026" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Category *</label>
                    <div className="relative">
                      <select
                        className="input-field appearance-none pr-8"
                        value={form.category}
                        onChange={(e) => setField('category', e.target.value)}
                      >
                        <option value="">Select…</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">No. of Participants</label>
                    <input
                      className="input-field"
                      type="number"
                      min={1}
                      value={form.num_participants}
                      onChange={(e) => setField('num_participants', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">Description / Song / Act Title</label>
                  <input className="input-field" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Optional — song name, act title, etc." />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving} className="btn btn-primary flex-1 disabled:opacity-60">
                    {saving ? 'Saving…' : (editing ? 'Save changes' : 'Submit registration')}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
