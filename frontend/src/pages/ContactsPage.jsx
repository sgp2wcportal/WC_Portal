import React, { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  Wrench,
  Siren,
  Building2,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'
import { contactService } from '../services/contactService'

const CATEGORY_ICONS = {
  'Welfare Committee': Users,
  'Siddha Maintenance': Wrench,
  'Emergency Services': Siren,
  'Building Management': Building2,
}

const getCategoryIcon = (category) => {
  for (const [key, Icon] of Object.entries(CATEGORY_ICONS)) {
    if (category?.toLowerCase().includes(key.toLowerCase().split(' ')[0].toLowerCase())) return Icon
  }
  return User
}

const EMPTY_FORM = {
  category: '',
  name: '',
  designation: '',
  description: '',
  contact_number: '',
}

export const ContactsPage = () => {
  const { role } = useAuthStore()
  const isAdmin = role === 'admin'

  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)   // Contact object being edited, or null for new
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await contactService.list()
      setContacts(res.data)
    } catch {
      toast.error('Failed to load contacts.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return contacts
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.designation?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.contact_number?.toLowerCase().includes(q),
    )
  }, [contacts, search])

  const grouped = useMemo(() => {
    return filtered.reduce((acc, c) => {
      const cat = c.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(c)
      return acc
    }, {})
  }, [filtered])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (contact) => {
    setEditing(contact)
    setForm({
      category: contact.category,
      name: contact.name,
      designation: contact.designation || '',
      description: contact.description || '',
      contact_number: contact.contact_number,
    })
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.category.trim() || !form.name.trim() || !form.contact_number.trim()) {
      toast.error('Category, Name, and Contact Number are required.')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const res = await contactService.update(editing.id, form)
        setContacts((prev) => prev.map((c) => (c.id === editing.id ? res.data : c)))
        toast.success('Contact updated.')
      } else {
        const res = await contactService.create(form)
        setContacts((prev) => [...prev, res.data])
        toast.success('Contact added.')
      }
      setShowForm(false)
    } catch {
      toast.error('Failed to save contact.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await contactService.delete(id)
      setContacts((prev) => prev.filter((c) => c.id !== id))
      toast.success('Contact deleted.')
    } catch {
      toast.error('Failed to delete contact.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">Contacts</h1>
          <p className="text-ink-500 text-sm mt-1">Welfare Committee, Maintenance, and Emergency contacts</p>
        </div>
        {isAdmin && (
          <button onClick={openAdd} className="btn btn-primary gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        )}
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search by name, category, designation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Contact List */}
      {loading ? (
        <div className="text-center py-16 text-ink-400">Loading contacts…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-ink-400">
          {search ? 'No contacts match your search.' : 'No contacts added yet.'}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => {
            const Icon = getCategoryIcon(category)
            return (
              <motion.section key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-saffron-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-saffron-600" />
                  </div>
                  <h2 className="font-display text-base font-semibold text-ink-800">{category}</h2>
                  <span className="text-xs text-ink-400 ml-1">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((c) => (
                    <div key={c.id} className="card p-4 flex gap-3 items-start group">
                      <div className="w-10 h-10 rounded-xl bg-saffron-50 border border-saffron-100 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-saffron-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink-900 text-sm">{c.name}</p>
                        {c.designation && (
                          <p className="text-xs text-saffron-700 font-medium">{c.designation}</p>
                        )}
                        {c.description && (
                          <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{c.description}</p>
                        )}
                        <a
                          href={`tel:${c.contact_number}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mt-1.5"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {c.contact_number}
                        </a>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(c)}
                            className="w-7 h-7 rounded-lg hover:bg-ink-100 flex items-center justify-center text-ink-400 hover:text-ink-700"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-ink-400 hover:text-rose-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.section>
            )
          })}
        </div>
      )}

      {/* Add / Edit modal */}
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
              className="bg-white rounded-2xl shadow-[0_30px_80px_-25px_rgba(28,25,23,0.4)] border border-ink-100 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold text-ink-900">
                  {editing ? 'Edit Contact' : 'Add Contact'}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                {[
                  { label: 'Category *', field: 'category', placeholder: 'e.g. Welfare Committee, Emergency Services' },
                  { label: 'Name *', field: 'name', placeholder: 'Full name' },
                  { label: 'Designation', field: 'designation', placeholder: 'e.g. Secretary, Plumber' },
                  { label: 'Description', field: 'description', placeholder: 'Short note (optional)' },
                  { label: 'Contact Number *', field: 'contact_number', placeholder: '+91 98765 43210' },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      {label}
                    </label>
                    <input
                      className="input-field"
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder}
                    />
                  </div>
                ))}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary flex-1 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : (editing ? 'Save changes' : 'Add contact')}
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
