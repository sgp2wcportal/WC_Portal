import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Megaphone, Plus, Trash2, Calendar, X, Sparkles, ImagePlus, Image as ImageIcon } from 'lucide-react'

import { announcementService } from '../services/announcementService'
import { storageUrl } from '../services/couponService'
import { useAuthStore } from '../store/authStore'

const fmtDate = (raw, withTime = true) => {
  const iso = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw + 'Z'
  return new Date(iso).toLocaleString(
    undefined,
    withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' },
  )
}

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const role = useAuthStore((state) => state.role)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', content: '', visible_until: '' })
  const [pendingImage, setPendingImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { fetchAnnouncements() }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementService.getAnnouncements()
      setAnnouncements(response.data)
    } catch {
      toast.error('Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        visible_until: formData.visible_until
          ? new Date(formData.visible_until + 'T23:59:59').toISOString()
          : null,
      }
      const res = await announcementService.createAnnouncement(payload)
      if (pendingImage) {
        try {
          await announcementService.uploadImage(res.data.id, pendingImage)
        } catch {
          toast.error('Announcement created but image upload failed')
        }
      }
      setFormData({ title: '', content: '', visible_until: '' })
      setPendingImage(null)
      setImagePreview(null)
      setShowForm(false)
      toast.success('Announcement posted!')
      fetchAnnouncements()
    } catch {
      toast.error('Failed to create announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImagePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleDeleteAnnouncement = async (id) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 min-w-[240px]">
          <p className="font-semibold text-ink-900">Delete this announcement?</p>
          <p className="text-xs text-ink-600">This cannot be undone.</p>
          <div className="flex gap-2 mt-1">
            <button
              className="btn btn-danger flex-1 py-1.5 text-xs"
              onClick={async () => {
                toast.dismiss(t.id)
                try {
                  await announcementService.deleteAnnouncement(id)
                  setAnnouncements((prev) => prev.filter((a) => a.id !== id))
                  toast.success('Deleted')
                } catch {
                  toast.error('Failed to delete')
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
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Hero strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hero mb-8 flex flex-wrap items-center justify-between gap-4"
      >
        <div className="absolute -right-20 -top-16 w-56 h-56 rounded-full bg-saffron-200/40 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-saffron-700 font-semibold text-xs uppercase tracking-[0.2em] mb-2 inline-flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Updates
          </p>
          <h1 className="display-title text-4xl">Announcements</h1>
          <p className="muted mt-1">News from Siddha Galaxia Phase II — Welfare Committee.</p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className={showForm ? 'btn btn-secondary relative' : 'btn btn-primary relative'}
          >
            {showForm ? (
              <><X className="w-4 h-4" /> Cancel</>
            ) : (
              <><Plus className="w-4 h-4" /> New announcement</>
            )}
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="card-elevated mb-8">
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                    placeholder="e.g. Diwali decorations meeting"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="input-field h-32"
                    required
                    placeholder="Share the details with your community…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Visible until <span className="text-ink-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.visible_until}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setFormData({ ...formData, visible_until: e.target.value })}
                    className="input-field"
                  />
                  <p className="text-xs text-ink-500 mt-1.5">
                    Leave blank to keep visible indefinitely.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                    Banner Image <span className="text-ink-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImagePick}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="btn btn-secondary gap-2"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {pendingImage ? pendingImage.name : 'Choose image'}
                  </button>
                  {imagePreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={imagePreview} alt="preview" className="h-28 rounded-xl object-cover border border-ink-100" />
                      <button
                        type="button"
                        onClick={() => { setPendingImage(null); setImagePreview(null) }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    <Sparkles className="w-4 h-4" />
                    {submitting ? 'Posting…' : 'Post announcement'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setPendingImage(null); setImagePreview(null) }} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-32 skeleton" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="card-elevated text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-saffron-50 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-6 h-6 text-saffron-600" />
          </div>
          <p className="font-display text-xl font-semibold text-ink-900">No announcements yet</p>
          <p className="muted mt-1">When the committee posts updates, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, idx) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * idx }}
              className="card-elevated relative overflow-hidden group p-0"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-saffron-grad z-10" />
              {storageUrl(a.image) ? (
                <img
                  src={storageUrl(a.image)}
                  alt={a.title}
                  className="w-full h-44 object-cover"
                />
              ) : null}
              <div className="p-6">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-display text-xl font-semibold text-ink-900 pr-6 leading-snug">
                  {a.title}
                </h3>
                {role === 'admin' && (
                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 shrink-0"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-ink-700 mt-2 whitespace-pre-line leading-relaxed">{a.content}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 items-center mt-4 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {fmtDate(a.created_at)}
                </span>
                {a.created_by && (
                  <span className="inline-flex items-center gap-1">
                    by <span className="font-medium text-ink-700">{a.created_by}</span>
                  </span>
                )}
                {a.visible_until && (
                  <span className="badge badge-amber">
                    Visible until {fmtDate(a.visible_until, false)}
                  </span>
                )}
              </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
