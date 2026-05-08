import React, { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  UtensilsCrossed,
  Ticket,
  LayoutDashboard,
  Settings2,
  ScanLine,
  Sparkles,
} from 'lucide-react'

import { couponService, storageUrl } from '../services/couponService'
import { useAuthStore } from '../store/authStore'
import { TOWERS, UNIT_NUMBERS } from '../lib/society'
import { LookupEditor } from '../components/LookupEditor'
import { RichTextEditor } from '../components/RichTextEditor'
import { SafeHtml } from '../components/SafeHtml'

const TABS = {
  BOOK: 'book',
  MINE: 'mine',
  DASHBOARD: 'dashboard',
  MANAGE: 'manage',
  SCAN: 'scan',
}

const fmtINR = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const fmtDate = (iso) =>
  iso
    ? new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso + 'Z').toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

const TAB_META = [
  { id: TABS.BOOK,      label: 'Book Coupons',    icon: Ticket,           adminOnly: false },
  { id: TABS.MINE,      label: 'My Coupons',      icon: UtensilsCrossed,  adminOnly: false },
  { id: TABS.DASHBOARD, label: 'Event Dashboard', icon: LayoutDashboard,  adminOnly: true  },
  { id: TABS.MANAGE,    label: 'Manage Events',   icon: Settings2,        adminOnly: true  },
  { id: TABS.SCAN,      label: 'Scan & Verify',   icon: ScanLine,         adminOnly: true  },
]

export const CouponsPage = () => {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'admin' || role === 'generic'

  const [tab, setTab] = useState(TABS.BOOK)
  const [menus, setMenus] = useState([])

  const onError = (msg) => msg && toast.error(msg)
  const onInfo = (msg) => msg && toast.success(msg)

  const reloadMenus = async () => {
    try {
      const r = await couponService.listMenus(isAdmin)
      setMenus(r.data)
    } catch {
      toast.error('Failed to load events')
    }
  }

  useEffect(() => {
    reloadMenus()
  }, [isAdmin])

  const visibleTabs = TAB_META.filter((t) => !t.adminOnly || isAdmin)

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hero mb-8 relative"
      >
        <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-saffron-200/40 blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-4 w-32 h-32 motif-dots rounded-full opacity-40 animate-spin-slow pointer-events-none" />
        <div className="relative">
          <p className="text-saffron-700 font-semibold text-xs uppercase tracking-[0.2em] mb-2 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Festive bookings
          </p>
          <h1 className="display-title text-4xl md:text-5xl">
            Food <span className="gradient-text italic">Coupons</span>
          </h1>
          <p className="muted mt-2 text-base">
            Book meal coupons, pay via UPI, scan QR codes on event day.
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-8 p-1.5 bg-white/70 backdrop-blur-sm border border-ink-100 rounded-2xl w-fit shadow-soft">
        {visibleTabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              className={`relative px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                active ? 'text-white' : 'text-ink-600 hover:text-ink-900 hover:bg-ink-50'
              }`}
              onClick={() => setTab(t.id)}
            >
              {active && (
                <motion.span
                  layoutId="coupon-tab-bg"
                  className="absolute inset-0 rounded-xl bg-saffron-grad shadow-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {t.label}
              </span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22 }}
        >
          {tab === TABS.BOOK && <BookCouponView menus={menus} onError={onError} onInfo={onInfo} />}
          {tab === TABS.MINE && <MyCouponsView />}
          {tab === TABS.DASHBOARD && isAdmin && (
            <EventDashboardView menus={menus} onError={onError} onInfo={onInfo} />
          )}
          {tab === TABS.MANAGE && isAdmin && (
            <ManageEventsView menus={menus} reload={reloadMenus} onError={onError} onInfo={onInfo} />
          )}
          {tab === TABS.SCAN && isAdmin && <ScanVerifyView onError={onError} onInfo={onInfo} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Book

const BookCouponView = ({ menus, onError, onInfo }) => {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'admin' || role === 'generic'

  const [form, setForm] = useState({
    tower: '',
    unit_number: '',
    contact_number: '',
    email: '',
    occasion: '',
    event_name: '',
    pax: 1,
    veg_count: 0,
    nonveg_count: 0,
    veg_kid_count: 0,
    nonveg_kid_count: 0,
    payment_method: 'upi',
    payer_upi_id: '',
    txn_reference: '',
  })
  const [occasions, setOccasions] = useState([])
  const [showOccasionEditor, setShowOccasionEditor] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState(null)

  const activeMenus = menus.filter((m) => m.is_active !== false)
  const filteredEvents = form.occasion
    ? activeMenus.filter((m) => (m.occasion || '') === form.occasion)
    : activeMenus
  const selectedMenu = activeMenus.find((m) => m.event_name === form.event_name)
  const hasVegKid = !!selectedMenu && selectedMenu.veg_kid_price != null
  const hasNonVegKid = !!selectedMenu && selectedMenu.nonveg_kid_price != null
  const total = selectedMenu
    ? form.veg_count * selectedMenu.veg_price
      + form.nonveg_count * selectedMenu.nonveg_price
      + form.veg_kid_count * (selectedMenu.veg_kid_price || 0)
      + form.nonveg_kid_count * (selectedMenu.nonveg_kid_price || 0)
    : 0
  const totalCoupons =
    Number(form.veg_count) + Number(form.nonveg_count)
    + Number(form.veg_kid_count) + Number(form.nonveg_kid_count)
  const paxMatches = form.pax === totalCoupons

  useEffect(() => {
    couponService
      .paymentInfo(total > 0 ? total : null)
      .then((r) => setPaymentInfo(r.data))
      .catch(() => setPaymentInfo(null))
  }, [total])

  const reloadOccasions = async () => {
    try {
      const r = await couponService.listOccasions()
      setOccasions(r.data)
    } catch {
      // already toasted upstream
    }
  }

  useEffect(() => {
    reloadOccasions()
  }, [])

  // If user changes occasion, clear event selection if it no longer matches
  useEffect(() => {
    if (!form.event_name || !form.occasion) return
    const m = activeMenus.find((mm) => mm.event_name === form.event_name)
    if (m && (m.occasion || '') !== form.occasion) {
      setForm((prev) => ({ ...prev, event_name: '' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.occasion])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.tower || !form.unit_number) {
      onError('Pick your Tower and Unit Number')
      return
    }
    if (!form.contact_number.trim()) {
      onError('Contact Number is required')
      return
    }
    if (!selectedMenu) {
      onError('Pick an event to continue')
      return
    }
    if (!paxMatches) {
      onError(`Pax (${form.pax}) must equal adult + kid coupon counts (${totalCoupons})`)
      return
    }
    const isUpi = form.payment_method === 'upi'
    const txn = form.txn_reference.trim()
    if (isUpi && txn.length > 0 && txn.length < 4) {
      onError('UPI transaction reference looks too short — enter the full UTR or leave it blank.')
      return
    }
    setSubmitting(true)
    try {
      const r = await couponService.bookCoupon({
        tower: form.tower,
        unit_number: form.unit_number,
        contact_number: form.contact_number.trim(),
        email: form.email,
        event_name: form.event_name,
        pax: Number(form.pax),
        veg_count: Number(form.veg_count),
        nonveg_count: Number(form.nonveg_count),
        veg_kid_count: Number(form.veg_kid_count),
        nonveg_kid_count: Number(form.nonveg_kid_count),
        payment_method: form.payment_method,
        txn_reference: isUpi ? (txn || null) : null,
        payer_upi_id: isUpi ? (form.payer_upi_id.trim() || null) : null,
      })
      setConfirmation(r.data)
      onInfo(
        r.data.delivery?.delivery === 'smtp'
          ? `Confirmation emailed to ${r.data.email}.`
          : `Booking confirmed. SMTP not configured — email saved to ${r.data.delivery?.path}.`,
      )
    } catch (err) {
      onError(err.response?.data?.detail || 'Failed to book coupons')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmation) {
    return <BookingReceipt booking={confirmation} onDone={() => setConfirmation(null)} />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={submit} className="card-elevated lg:col-span-2 space-y-4">
        <h2 className="section-title">Book Food Coupons</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Tower" required>
            <select
              className="input-field"
              required
              value={form.tower}
              onChange={(e) => setForm({ ...form, tower: e.target.value })}
            >
              <option value="">Select tower</option>
              {TOWERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Unit Number" required>
            <select
              className="input-field"
              required
              value={form.unit_number}
              onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
            >
              <option value="">Select unit</option>
              {UNIT_NUMBERS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Contact Number" required>
            <input
              type="tel"
              className="input-field"
              required
              value={form.contact_number}
              onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
              placeholder="e.g. 9876543210"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              className="input-field"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="resident@example.com"
            />
          </Field>
        </div>

        <Field label="Occasion" required>
          <div className="flex gap-2">
            <select
              className="input-field"
              required
              value={form.occasion}
              onChange={(e) => setForm({ ...form, occasion: e.target.value })}
            >
              <option value="">Select occasion</option>
              {occasions.map((o) => (
                <option key={o.id} value={o.name}>{o.name}</option>
              ))}
            </select>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowOccasionEditor((v) => !v)}
                className="btn btn-secondary !px-3"
                title="Manage occasion options"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <AnimatePresence>
            {showOccasionEditor && isAdmin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <LookupEditor
                  title="Occasions"
                  hint="Used for the Occasion dropdown when booking and tagging events."
                  items={occasions}
                  addPlaceholder="Add a new occasion…"
                  onAdd={async (name) => {
                    try {
                      await couponService.addOccasion(name)
                      onInfo('Occasion added')
                      reloadOccasions()
                    } catch (err) {
                      onError(err.response?.data?.detail || 'Could not add')
                    }
                  }}
                  onDelete={async (id, name) => {
                    try {
                      await couponService.deleteOccasion(id)
                      onInfo(`Removed "${name}"`)
                      reloadOccasions()
                    } catch (err) {
                      onError(err.response?.data?.detail || 'Could not delete')
                    }
                  }}
                  onRename={async (id, newName, oldName) => {
                    try {
                      await couponService.renameOccasion(id, newName)
                      onInfo(`Renamed "${oldName}" → "${newName}"`)
                      reloadOccasions()
                    } catch (err) {
                      onError(err.response?.data?.detail || 'Could not rename')
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Field>

        <Field label="Event" required>
          <select
            className="input-field"
            required
            value={form.event_name}
            onChange={(e) => setForm({ ...form, event_name: e.target.value })}
          >
            <option value="">Select event</option>
            {filteredEvents.map((m) => (
              <option key={m.id} value={m.event_name}>
                {m.event_name} — Veg {fmtINR(m.veg_price)} / Non-Veg {fmtINR(m.nonveg_price)}
              </option>
            ))}
          </select>
          {!activeMenus.length ? (
            <p className="muted mt-1">No events open for booking. Ask your admin to create one.</p>
          ) : !filteredEvents.length && form.occasion ? (
            <p className="muted mt-1">No events tagged with "{form.occasion}".</p>
          ) : null}
        </Field>

        {selectedMenu && <MenuPreview menu={selectedMenu} />}

        {selectedMenu && (
          <>
            <Field label="No. of pax" required>
              <input
                type="number"
                min="1"
                className="input-field"
                required
                value={form.pax}
                onChange={(e) => setForm({ ...form, pax: parseInt(e.target.value) || 0 })}
              />
            </Field>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
              <p className="text-sm font-semibold text-emerald-800">Adult coupons</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label={`Veg (Adult) — ${fmtINR(selectedMenu.veg_price)} ea.`}>
                  <input
                    type="number" min="0" className="input-field"
                    value={form.veg_count}
                    onChange={(e) => setForm({ ...form, veg_count: parseInt(e.target.value) || 0 })}
                  />
                </Field>
                <Field label={`Non-Veg (Adult) — ${fmtINR(selectedMenu.nonveg_price)} ea.`}>
                  <input
                    type="number" min="0" className="input-field"
                    value={form.nonveg_count}
                    onChange={(e) => setForm({ ...form, nonveg_count: parseInt(e.target.value) || 0 })}
                  />
                </Field>
              </div>
            </div>

            {(hasVegKid || hasNonVegKid) && (
              <div className="rounded-xl border border-saffron-100 bg-saffron-50/40 p-4 space-y-3">
                <p className="text-sm font-semibold text-saffron-800">Kid coupons</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hasVegKid ? (
                    <Field label={`Veg (Kid) — ${fmtINR(selectedMenu.veg_kid_price)} ea.`}>
                      <input
                        type="number" min="0" className="input-field"
                        value={form.veg_kid_count}
                        onChange={(e) => setForm({ ...form, veg_kid_count: parseInt(e.target.value) || 0 })}
                      />
                    </Field>
                  ) : (
                    <p className="text-xs text-ink-500 self-end pb-2">Veg kid price not set for this event.</p>
                  )}
                  {hasNonVegKid ? (
                    <Field label={`Non-Veg (Kid) — ${fmtINR(selectedMenu.nonveg_kid_price)} ea.`}>
                      <input
                        type="number" min="0" className="input-field"
                        value={form.nonveg_kid_count}
                        onChange={(e) => setForm({ ...form, nonveg_kid_count: parseInt(e.target.value) || 0 })}
                      />
                    </Field>
                  ) : (
                    <p className="text-xs text-ink-500 self-end pb-2">Non-veg kid price not set for this event.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {selectedMenu && !paxMatches && (
          <p className="text-amber-600 text-sm">
            Pax ({form.pax}) must equal Adult + Kid coupons ({totalCoupons}).
          </p>
        )}

        {selectedMenu && total > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-3">
            <div>
              <p className="font-semibold text-amber-900">Step 2 — Confirm payment</p>
              <p className="text-sm text-amber-800 mt-0.5">
                Total payable: <b>{fmtINR(total)}</b>. Choose how you'll pay below — the
                committee admin will mark your booking as verified once the payment lands.
              </p>
            </div>

            <Field label="Payment method" required>
              <select
                className="input-field"
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              >
                <option value="upi">UPI (online)</option>
                <option value="cash">Cash (in-person)</option>
              </select>
            </Field>

            {form.payment_method === 'upi' ? (
              <>
                <p className="text-sm text-amber-800">
                  Pay via the UPI QR on the right, then paste your UPI Transaction ID
                  below if you have one. <b>It's optional</b> — leave blank if you can't
                  find it; admin can still reconcile manually.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="UPI Transaction ID / UTR (optional)">
                    <input
                      className="input-field font-mono"
                      maxLength={64}
                      value={form.txn_reference}
                      onChange={(e) => setForm({ ...form, txn_reference: e.target.value })}
                      placeholder="e.g. 412345678901"
                    />
                  </Field>
                  <Field label="Your UPI ID (optional)">
                    <input
                      className="input-field font-mono"
                      maxLength={128}
                      value={form.payer_upi_id}
                      onChange={(e) => setForm({ ...form, payer_upi_id: e.target.value })}
                      placeholder="e.g. yourname@oksbi"
                    />
                  </Field>
                </div>
                <p className="text-xs text-amber-800">
                  In Google Pay, tap the completed payment → "UPI transaction ID" or "UTR".
                  In PhonePe, open the receipt → "Transaction ID".
                </p>
              </>
            ) : (
              <p className="text-sm text-amber-800">
                You'll pay <b>{fmtINR(total)}</b> in cash to the committee. Submit your
                booking below — it'll show as <i>Pending Verification</i> until admin
                confirms receipt.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-sm text-gray-500">Total payable</p>
            <p className="text-3xl font-bold text-emerald-600">{fmtINR(total)}</p>
          </div>
          <button
            type="submit"
            disabled={submitting || !paxMatches || !total}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Booking'}
          </button>
        </div>
      </form>

      <PaymentPanel total={total} info={paymentInfo} />
    </div>
  )
}

const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
  </label>
)

const MenuPreview = ({ menu }) => (
  <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
    <h3 className="font-semibold text-gray-900 mb-3">{menu.event_name}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MenuTile
        label="Veg"
        adultPrice={menu.veg_price}
        kidPrice={menu.veg_kid_price}
        description={menu.veg_menu}
        image={menu.veg_image}
      />
      <MenuTile
        label="Non-Veg"
        adultPrice={menu.nonveg_price}
        kidPrice={menu.nonveg_kid_price}
        description={menu.nonveg_menu}
        image={menu.nonveg_image}
      />
    </div>
  </div>
)

const MenuTile = ({ label, adultPrice, kidPrice, description, image }) => (
  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
    {storageUrl(image) ? (
      <img src={storageUrl(image)} alt={label} className="w-full h-32 object-cover" />
    ) : (
      <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-gray-300 text-sm">
        No image
      </div>
    )}
    <div className="p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-semibold">{label}</p>
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="badge badge-blue">Adult {fmtINR(adultPrice)}</span>
          {kidPrice != null && (
            <span className="badge badge-amber">Kid {fmtINR(kidPrice)}</span>
          )}
        </div>
      </div>
      <SafeHtml html={description} className="text-sm text-gray-600 mt-1" />
    </div>
  </div>
)

const PaymentPanel = ({ total, info }) => (
  <div className="card-elevated">
    <h3 className="font-semibold text-gray-900 mb-1">Pay via UPI</h3>
    <p className="muted mb-4">Scan with any UPI app, then submit your booking.</p>
    <div className="flex items-center justify-center bg-white border border-gray-200 rounded-xl p-4">
      {info ? (
        <QRCodeCanvas value={info.upi_uri} size={196} includeMargin />
      ) : (
        <div className="w-[196px] h-[196px] bg-gray-50 animate-pulse" />
      )}
    </div>
    <div className="mt-4 space-y-1 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500">UPI ID</span>
        <span className="font-mono">{info?.upi_id || '—'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Payee</span>
        <span>{info?.upi_name || '—'}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Amount</span>
        <span className="font-semibold">{fmtINR(total)}</span>
      </div>
    </div>
  </div>
)

const BookingReceipt = ({ booking, onDone }) => (
  <div className="card-elevated space-y-4">
    <div className="flex items-start justify-between">
      <div>
        <h2 className="section-title">Booking confirmed</h2>
        <p className="muted">
          {booking.tickets.length} ticket{booking.tickets.length === 1 ? '' : 's'} for{' '}
          <b>{booking.event_name}</b>. Show each QR to the volunteer at the dining area —
          they will scan it from the portal's <i>Scan &amp; Verify</i> page.
        </p>
        <p className="muted mt-1">
          A regular phone camera or Google Lens will say "no data found" — that's expected.
          The QR carries an internal ticket id, not a URL.
        </p>
      </div>
      <button onClick={onDone} className="btn-ghost">Book another</button>
    </div>
    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <span>UPI Txn ID: <span className="font-mono">{booking.txn_reference || '—'}</span></span>
        {booking.payer_upi_id && (
          <span>From: <span className="font-mono">{booking.payer_upi_id}</span></span>
        )}
        <span>Status: {booking.payment_verified ? 'Verified by committee' : 'Pending reconciliation'}</span>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {booking.tickets.map((t) => (
        <div key={t.id} className="border border-gray-200 rounded-lg p-3 flex flex-col items-center bg-gray-50">
          <img
            src={storageUrl(t.qr_code_path)}
            alt="Ticket QR"
            className="w-40 h-40 object-contain bg-white rounded"
          />
          <div className="mt-2 text-center">
            <TicketBadge ticket={t} />
            <p className="font-mono text-xs text-gray-500 mt-1 break-all">{t.id.slice(0, 8)}…</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const ticketLabel = (t) => {
  if (t.ticket_type === 'veg')    return t.is_kid ? 'Kids - Veg'     : 'Veg'
  if (t.ticket_type === 'nonveg') return t.is_kid ? 'Kids - Non-Veg' : 'Non-Veg'
  return t.ticket_type
}

const ticketBadgeClass = (t) => {
  if (t.is_kid) return 'badge-blue'
  return t.ticket_type === 'veg' ? 'badge-green' : 'badge-amber'
}

const TicketBadge = ({ ticket }) => (
  <span className={`badge ${ticketBadgeClass(ticket)}`}>
    {ticketLabel(ticket)}
  </span>
)

// -----------------------------------------------------------------------------
// My Coupons

const MyCouponsView = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    couponService
      .listMyCoupons()
      .then((r) => setBookings(r.data))
      .catch(() => setError('Failed to load your coupons'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="muted">Loading…</div>
  if (error) return <div className="text-rose-600">{error}</div>
  if (!bookings.length) return <div className="muted">You haven’t booked any coupons yet.</div>

  return (
    <div className="space-y-6">
      {bookings.map((b) => (
        <div key={b.id} className="card-elevated">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl font-bold">{b.event_name}</h3>
              <p className="muted">
                Flat {b.flat_number} · {b.pax} pax · {b.veg_count} veg + {b.nonveg_count} non-veg ·
                booked {fmtDate(b.created_at)}
              </p>
            </div>
            <div className="text-right">
              <p className="muted">Total</p>
              <p className="text-2xl font-bold text-emerald-600">{fmtINR(b.total_amount)}</p>
              {b.is_verified ? (
                <span className="badge badge-green mt-1">All used</span>
              ) : (
                <span className="badge badge-blue mt-1">{b.tickets.filter((t) => !t.is_used).length} unused</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-4 -mt-2">
            <span className="text-gray-600">
              Txn ID: <span className="font-mono text-gray-900">{b.txn_reference || '—'}</span>
            </span>
            {b.payer_upi_id && (
              <span className="text-gray-600">
                Paid from: <span className="font-mono text-gray-900">{b.payer_upi_id}</span>
              </span>
            )}
            <span className="text-gray-600">
              Payment:{' '}
              {b.payment_verified ? (
                <span className="badge badge-green">Verified</span>
              ) : (
                <span className="badge badge-amber">Pending reconciliation</span>
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {b.tickets.map((t) => (
              <div key={t.id} className={`border rounded-lg p-2 ${t.is_used ? 'border-gray-200 opacity-60' : 'border-emerald-200'}`}>
                <img src={storageUrl(t.qr_code_path)} alt="Ticket" className="w-full aspect-square object-contain bg-white" />
                <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                  <TicketBadge ticket={t} />
                  {t.is_used ? (
                    <span className="badge badge-red">Used</span>
                  ) : (
                    <span className="badge badge-blue">Unused</span>
                  )}
                </div>
                {t.is_used && (
                  <p className="muted mt-1">Used {fmtDate(t.used_at)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Event Dashboard

const REFRESH_MS = 10000

const splitFlat = (flat) => {
  if (!flat) return { building: '', unit: '', unitNum: Number.POSITIVE_INFINITY }
  const m = flat.match(/^\s*([A-Za-z]+|\d+)[\s-_/]+(.+?)\s*$/)
  if (!m) return { building: flat.trim(), unit: '', unitNum: Number.POSITIVE_INFINITY }
  const building = m[1]
  const unit = m[2]
  const numMatch = unit.match(/\d+/)
  return {
    building,
    unit,
    unitNum: numMatch ? parseInt(numMatch[0], 10) : Number.POSITIVE_INFINITY,
  }
}

const compareBy = (key, dir) => (a, b) => {
  const sign = dir === 'desc' ? -1 : 1
  const av = a[key]
  const bv = b[key]
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  if (typeof av === 'number' && typeof bv === 'number') return sign * (av - bv)
  return sign * String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
}

const EventDashboardView = ({ menus, onError, onInfo }) => {
  const [eventName, setEventName] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sortKey, setSortKey] = useState('building')
  const [sortDir, setSortDir] = useState('asc')
  const [editing, setEditing] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!eventName && menus.length) setEventName(menus[0].event_name)
  }, [menus, eventName])

  const fetchDashboard = async () => {
    if (!eventName) return
    setLoading(true)
    try {
      const r = await couponService.eventDashboard(eventName)
      setData(r.data)
    } catch (err) {
      onError(err.response?.data?.detail || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [eventName])

  useEffect(() => {
    if (!autoRefresh || !eventName) return
    const id = setInterval(fetchDashboard, REFRESH_MS)
    return () => clearInterval(id)
  }, [autoRefresh, eventName])

  const rows = useMemo(() => {
    if (!data) return []
    return data.bookings.map((b) => {
      const { building, unit, unitNum } = splitFlat(b.flat_number)
      const used = b.tickets.filter((t) => t.is_used).length
      return {
        ...b,
        building,
        unit,
        unitNum,
        used,
        remaining: b.tickets.length - used,
      }
    })
  }, [data])

  const sortedRows = useMemo(() => {
    const cmp =
      sortKey === 'building'
        ? (a, b) => {
            const sign = sortDir === 'desc' ? -1 : 1
            const buildCmp = String(a.building).localeCompare(String(b.building), undefined, { numeric: true, sensitivity: 'base' })
            if (buildCmp !== 0) return sign * buildCmp
            return sign * (a.unitNum - b.unitNum || String(a.unit).localeCompare(String(b.unit)))
          }
        : compareBy(sortKey, sortDir)
    return [...rows].sort(cmp)
  }, [rows, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const onEdited = async () => {
    setEditing(null)
    onInfo('Booking updated')
    await fetchDashboard()
  }

  const t = data?.totals

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Event</span>
            <select
              className="input-field min-w-[260px]"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            >
              {menus.map((m) => (
                <option key={m.id} value={m.event_name}>{m.event_name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 mt-6 muted">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh every 10s
          </label>
        </div>
        <button className="btn-ghost mt-6" onClick={fetchDashboard} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh now'}
        </button>
      </div>

      {t && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Bookings" value={t.bookings} />
          <Stat label="Total pax" value={t.pax} />
          <Stat
            label="Veg"
            value={`${t.veg_used} / ${t.veg}`}
            sub={`${t.veg_remaining} left`}
            tone="green"
          />
          <Stat
            label="Non-Veg"
            value={`${t.nonveg_used} / ${t.nonveg}`}
            sub={`${t.nonveg_remaining} left`}
            tone="amber"
          />
          <Stat label="Total collected" value={fmtINR(t.total_amount)} tone="blue" />
        </div>
      )}

      {data && (
        <div className="card-elevated overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-200">
                <Th label="Building" k="building" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('building')} />
                <Th label="Flat" k="flat_number" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('flat_number')} />
                <Th label="Email" k="email" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('email')} />
                <Th label="Pax" k="pax" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('pax')} />
                <Th label="Veg" k="veg_count" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('veg_count')} />
                <Th label="Non-Veg" k="nonveg_count" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('nonveg_count')} />
                <Th label="Used" k="used" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('used')} />
                <Th label="Total" k="total_amount" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('total_amount')} />
                <Th label="Txn ID" k="txn_reference" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('txn_reference')} />
                <Th label="Payer UPI" k="payer_upi_id" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('payer_upi_id')} />
                <Th label="Paid" k="payment_verified" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('payment_verified')} />
                <Th label="Booked" k="created_at" sortKey={sortKey} sortDir={sortDir} onClick={() => toggleSort('created_at')} />
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 && (
                <tr><td colSpan="13" className="px-3 py-8 text-center muted">No bookings yet for this event.</td></tr>
              )}
              {sortedRows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">{r.building || '—'}</td>
                  <td className="px-3 py-2">{r.flat_number}</td>
                  <td className="px-3 py-2 text-gray-700">{r.email}</td>
                  <td className="px-3 py-2">{r.pax}</td>
                  <td className="px-3 py-2">{r.veg_count}</td>
                  <td className="px-3 py-2">{r.nonveg_count}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${r.used === r.tickets.length ? 'badge-green' : r.used > 0 ? 'badge-amber' : 'badge-blue'}`}>
                      {r.used}/{r.tickets.length}
                    </span>
                  </td>
                  <td className="px-3 py-2">{fmtINR(r.total_amount)}</td>
                  <td className="px-3 py-2 font-mono text-xs break-all max-w-[160px]" title={r.txn_reference || ''}>
                    {r.txn_reference || <span className="text-rose-500">—</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs break-all max-w-[160px]" title={r.payer_upi_id || ''}>
                    {r.payer_upi_id || <span className="muted">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    {r.payment_verified ? (
                      <span className="badge badge-green">Verified</span>
                    ) : (
                      <span className="badge badge-amber">Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-2 muted">{fmtDate(r.created_at)}</td>
                  <td className="px-3 py-2 text-right">
                    <button className="btn-ghost" onClick={() => setEditing(r)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <BookingEditModal
            booking={editing}
            onClose={() => setEditing(null)}
            onSaved={onEdited}
            onError={onError}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

const Stat = ({ label, value, sub, tone }) => {
  const ring =
    tone === 'green' ? 'ring-emerald-100 bg-emerald-50' :
    tone === 'amber' ? 'ring-amber-100 bg-amber-50' :
    tone === 'blue' ? 'ring-blue-100 bg-blue-50' :
    'ring-gray-100 bg-white'
  return (
    <div className={`rounded-xl border border-gray-100 ring-1 ${ring} p-4`}>
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="muted mt-1">{sub}</p>}
    </div>
  )
}

const Th = ({ label, k, sortKey, sortDir, onClick }) => {
  const active = sortKey === k
  return (
    <th
      onClick={onClick}
      className={`px-3 py-2 cursor-pointer select-none ${active ? 'text-gray-900' : ''}`}
    >
      <span>{label}</span>
      <span className="ml-1 text-xs text-gray-400">{active ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
    </th>
  )
}

const BookingEditModal = ({ booking, onClose, onSaved, onError }) => {
  const [form, setForm] = useState({
    flat_number: booking.flat_number,
    email: booking.email,
    pax: booking.pax,
    veg_count: booking.veg_count,
    nonveg_count: booking.nonveg_count,
    txn_reference: booking.txn_reference || '',
    payer_upi_id: booking.payer_upi_id || '',
    payment_verified: !!booking.payment_verified,
  })
  const [busy, setBusy] = useState(false)
  const usedVeg = booking.tickets.filter((t) => t.ticket_type === 'veg' && t.is_used).length
  const usedNon = booking.tickets.filter((t) => t.ticket_type === 'nonveg' && t.is_used).length

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await couponService.updateBooking(booking.id, {
        flat_number: form.flat_number,
        email: form.email,
        pax: Number(form.pax),
        veg_count: Number(form.veg_count),
        nonveg_count: Number(form.nonveg_count),
        txn_reference: form.txn_reference.trim(),
        payer_upi_id: form.payer_upi_id.trim() || null,
        payment_verified: form.payment_verified,
      })
      onSaved()
    } catch (err) {
      onError(err.response?.data?.detail || 'Failed to save booking')
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
        className="bg-white rounded-2xl shadow-[0_30px_80px_-25px_rgba(28,25,23,0.4)] border border-ink-100 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-2xl font-semibold text-ink-900">Edit booking</h3>
            <p className="muted">{booking.event_name}</p>
          </div>
          <button type="button" className="btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Flat number" required>
            <input className="input-field" required value={form.flat_number}
              onChange={(e) => setForm({ ...form, flat_number: e.target.value })} />
          </Field>
          <Field label="Email" required>
            <input type="email" className="input-field" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Pax" required>
            <input type="number" min="1" className="input-field" required value={form.pax}
              onChange={(e) => setForm({ ...form, pax: parseInt(e.target.value) || 0 })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Veg">
              <input type="number" min={usedVeg} className="input-field" value={form.veg_count}
                onChange={(e) => setForm({ ...form, veg_count: parseInt(e.target.value) || 0 })} />
            </Field>
            <Field label="Non-Veg">
              <input type="number" min={usedNon} className="input-field" value={form.nonveg_count}
                onChange={(e) => setForm({ ...form, nonveg_count: parseInt(e.target.value) || 0 })} />
            </Field>
          </div>
        </div>

        {(usedVeg + usedNon) > 0 && (
          <p className="muted">
            Already used: {usedVeg} veg, {usedNon} non-veg. Counts cannot drop below those.
          </p>
        )}
        {form.pax !== Number(form.veg_count) + Number(form.nonveg_count) && (
          <p className="text-amber-600 text-sm">
            Pax must equal veg + non-veg ({Number(form.veg_count) + Number(form.nonveg_count)}).
          </p>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="font-semibold text-gray-800">Payment reconciliation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="UPI Txn ID / UTR" required>
              <input
                className="input-field font-mono"
                required
                minLength={4}
                maxLength={64}
                value={form.txn_reference}
                onChange={(e) => setForm({ ...form, txn_reference: e.target.value })}
              />
            </Field>
            <Field label="Payer UPI ID">
              <input
                className="input-field font-mono"
                maxLength={128}
                value={form.payer_upi_id}
                onChange={(e) => setForm({ ...form, payer_upi_id: e.target.value })}
                placeholder="optional"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.payment_verified}
              onChange={(e) => setForm({ ...form, payment_verified: e.target.checked })}
            />
            Payment verified against bank statement
          </label>
          {booking.payment_verified_at && (
            <p className="muted text-xs">
              Last verified {fmtDate(booking.payment_verified_at)}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </motion.form>
    </motion.div>
  )
}

// -----------------------------------------------------------------------------
// Manage Events

const ManageEventsView = ({ menus, reload, onError, onInfo }) => {
  const [editing, setEditing] = useState(null) // null | 'new' | menu
  const [occasions, setOccasions] = useState([])

  const reloadOccasions = async () => {
    try {
      const r = await couponService.listOccasions()
      setOccasions(r.data)
    } catch {
      // already toasted
    }
  }
  useEffect(() => { reloadOccasions() }, [])

  return (
    <div className="space-y-6">
      <LookupEditor
        title="Occasions"
        hint="Manage the Occasion dropdown shown on the Book Coupons tab and tag events here. Rename cascades to existing events."
        items={occasions}
        addPlaceholder="Add a new occasion (e.g. Pongal, Eid, Christmas)…"
        onAdd={async (name) => {
          try {
            await couponService.addOccasion(name)
            onInfo('Occasion added')
            reloadOccasions()
          } catch (err) {
            onError(err.response?.data?.detail || 'Could not add')
          }
        }}
        onDelete={async (id, name) => {
          try {
            await couponService.deleteOccasion(id)
            onInfo(`Removed "${name}"`)
            reloadOccasions()
          } catch (err) {
            onError(err.response?.data?.detail || 'Could not delete')
          }
        }}
        onRename={async (id, newName, oldName) => {
          try {
            await couponService.renameOccasion(id, newName)
            onInfo(`Renamed "${oldName}" → "${newName}"`)
            reloadOccasions()
            await reload()  // events tagged with old name also got re-tagged on the server
          } catch (err) {
            onError(err.response?.data?.detail || 'Could not rename')
          }
        }}
      />

      <div className="flex items-center justify-between">
        <h2 className="section-title">Events &amp; Menus</h2>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>+ New Event</button>
      </div>

      {editing === 'new' && (
        <MenuForm
          occasions={occasions}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            await reload()
            setEditing(null)
            onInfo('Event created')
          }}
          onError={onError}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menus.map((m) => (
          <MenuCard
            key={m.id}
            menu={m}
            occasions={occasions}
            editing={editing && editing.id === m.id}
            onStartEdit={() => setEditing(m)}
            onCancelEdit={() => setEditing(null)}
            onChanged={async () => { await reload(); setEditing(null); onInfo('Saved') }}
            onDeleted={async () => { await reload(); onInfo('Event deactivated') }}
            onError={onError}
          />
        ))}
        {!menus.length && <p className="muted">No events yet. Click “New Event” to add one.</p>}
      </div>
    </div>
  )
}

const emptyMenu = {
  event_name: '',
  event_date: '',
  occasion: '',
  veg_price: '',
  nonveg_price: '',
  veg_kid_price: '',
  nonveg_kid_price: '',
  veg_menu: '',
  nonveg_menu: '',
}

const MenuForm = ({ initial, onCancel, onSaved, onError, occasions }) => {
  const [form, setForm] = useState(() => {
    if (!initial) return { ...emptyMenu }
    return {
      ...emptyMenu,
      ...initial,
      event_date: initial.event_date ? initial.event_date.slice(0, 10) : '',
      veg_kid_price: initial.veg_kid_price ?? '',
      nonveg_kid_price: initial.nonveg_kid_price ?? '',
      occasion: initial.occasion ?? '',
    }
  })
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const numOrNull = (v) => (v === '' || v == null ? null : Number(v))
    const payload = {
      event_name: form.event_name,
      event_date: form.event_date ? new Date(form.event_date + 'T00:00:00').toISOString() : null,
      occasion: form.occasion || null,
      veg_price: Number(form.veg_price),
      nonveg_price: Number(form.nonveg_price),
      veg_kid_price: numOrNull(form.veg_kid_price),
      nonveg_kid_price: numOrNull(form.nonveg_kid_price),
      veg_menu: form.veg_menu,
      nonveg_menu: form.nonveg_menu,
    }
    try {
      if (initial?.id) {
        await couponService.updateMenu(initial.id, payload)
      } else {
        await couponService.createMenu(payload)
      }
      onSaved()
    } catch (err) {
      onError(err.response?.data?.detail || 'Failed to save event')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="card-elevated space-y-4">
      <h3 className="font-semibold text-lg">{initial?.id ? 'Edit event' : 'New event'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Event name" required>
          <input className="input-field" required value={form.event_name}
            onChange={(e) => setForm({ ...form, event_name: e.target.value })} />
        </Field>
        <Field label="Event date">
          <input type="date" className="input-field" value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
        </Field>
        <Field label="Occasion">
          <select className="input-field" value={form.occasion}
            onChange={(e) => setForm({ ...form, occasion: e.target.value })}>
            <option value="">— Not tagged —</option>
            {(occasions || []).map((o) => <option key={o.id} value={o.name}>{o.name}</option>)}
          </select>
        </Field>
        <span /> {/* spacer to keep the next pair on a new visual row */}
        <Field label="Veg (Adult) price (₹)" required>
          <input type="number" min="0" step="0.01" className="input-field" required value={form.veg_price}
            onChange={(e) => setForm({ ...form, veg_price: e.target.value })} />
        </Field>
        <Field label="Non-Veg (Adult) price (₹)" required>
          <input type="number" min="0" step="0.01" className="input-field" required value={form.nonveg_price}
            onChange={(e) => setForm({ ...form, nonveg_price: e.target.value })} />
        </Field>
        <Field label="Veg (Kid) price (₹)">
          <input type="number" min="0" step="0.01" className="input-field" value={form.veg_kid_price}
            onChange={(e) => setForm({ ...form, veg_kid_price: e.target.value })}
            placeholder="Leave blank if not applicable" />
        </Field>
        <Field label="Non-Veg (Kid) price (₹)">
          <input type="number" min="0" step="0.01" className="input-field" value={form.nonveg_kid_price}
            onChange={(e) => setForm({ ...form, nonveg_kid_price: e.target.value })}
            placeholder="Leave blank if not applicable" />
        </Field>
      </div>
      <Field label="Veg menu description" required>
        <RichTextEditor
          value={form.veg_menu}
          onChange={(html) => setForm({ ...form, veg_menu: html })}
          placeholder="Describe the veg thali — courses, dishes, special items…"
        />
      </Field>
      <Field label="Non-Veg menu description" required>
        <RichTextEditor
          value={form.nonveg_menu}
          onChange={(html) => setForm({ ...form, nonveg_menu: html })}
          placeholder="Describe the non-veg thali — starters, mains, sides…"
        />
      </Field>
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

const MenuCard = ({ menu, occasions, editing, onStartEdit, onCancelEdit, onChanged, onDeleted, onError }) => {
  const vegInputRef = useRef(null)
  const nvInputRef = useRef(null)

  const upload = async (type, file) => {
    if (!file) return
    try {
      await couponService.uploadMenuImage(menu.id, type, file)
      onChanged()
    } catch (err) {
      onError(err.response?.data?.detail || 'Image upload failed')
    }
  }

  const remove = async () => {
    if (!window.confirm(`Deactivate "${menu.event_name}"? Existing bookings stay valid.`)) return
    try {
      await couponService.deleteMenu(menu.id)
      onDeleted()
    } catch {
      onError('Delete failed')
    }
  }

  if (editing) {
    return <MenuForm initial={menu} occasions={occasions} onCancel={onCancelEdit} onSaved={onChanged} onError={onError} />
  }

  return (
    <div className="card-elevated space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold">{menu.event_name}</h3>
          {menu.event_date && (
            <p className="muted">{new Date(menu.event_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
          )}
          {menu.is_active === false && <span className="badge badge-red mt-1">Inactive</span>}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onStartEdit}>Edit</button>
          <button className="btn-ghost text-rose-600 hover:bg-rose-50" onClick={remove}>Delete</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ImageEditor
          label="Veg"
          adultPrice={menu.veg_price}
          kidPrice={menu.veg_kid_price}
          description={menu.veg_menu}
          image={menu.veg_image}
          onPick={() => vegInputRef.current?.click()}
        />
        <input ref={vegInputRef} type="file" accept="image/*" hidden
          onChange={(e) => upload('veg', e.target.files?.[0])} />
        <ImageEditor
          label="Non-Veg"
          adultPrice={menu.nonveg_price}
          kidPrice={menu.nonveg_kid_price}
          description={menu.nonveg_menu}
          image={menu.nonveg_image}
          onPick={() => nvInputRef.current?.click()}
        />
        <input ref={nvInputRef} type="file" accept="image/*" hidden
          onChange={(e) => upload('nonveg', e.target.files?.[0])} />
      </div>
    </div>
  )
}

const ImageEditor = ({ label, adultPrice, kidPrice, description, image, onPick }) => (
  <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
    {storageUrl(image) ? (
      <img src={storageUrl(image)} alt={label} className="w-full h-32 object-cover" />
    ) : (
      <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-gray-300 text-sm">
        No image
      </div>
    )}
    <div className="p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-semibold">{label}</p>
        <div className="flex flex-wrap gap-1 text-xs">
          <span className="badge badge-blue">Adult {fmtINR(adultPrice)}</span>
          {kidPrice != null && (
            <span className="badge badge-amber">Kid {fmtINR(kidPrice)}</span>
          )}
        </div>
      </div>
      <SafeHtml html={description} className="text-sm text-gray-600 mt-1 line-clamp-3" />
      <button type="button" className="btn-ghost mt-2" onClick={onPick}>
        {image ? 'Replace image' : 'Upload image'}
      </button>
    </div>
  </div>
)

// -----------------------------------------------------------------------------
// Scan & Verify

const ScanVerifyView = ({ onError, onInfo }) => {
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [manualCode, setManualCode] = useState('')
  const [cameraError, setCameraError] = useState('')
  const scannerRef = useRef(null)
  const elementId = 'qr-reader'

  const cleanup = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.clear() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  const handleResult = async (decoded) => {
    if (!decoded) return
    await cleanup()
    try {
      const r = await couponService.verifyTicket(decoded)
      setLastResult({ kind: 'verified', ticket: r.data })
      onInfo(`Verified ticket ${r.data.id}`)
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail || 'Ticket not found'
      if (status === 409) {
        setLastResult({ kind: 'already_used', detail })
      } else {
        setLastResult({ kind: 'error', detail })
        onError(detail)
      }
    }
  }

  const start = () => {
    setCameraError('')
    setLastResult(null)
    setScanning(true)
    onError('')
    // Wait one tick so React commits the empty container before the
    // library injects its UI into it.
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          elementId,
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            // Default to back camera on phones; falls back automatically on
            // devices that don't have one (e.g. laptops with a front webcam).
            videoConstraints: { facingMode: { ideal: 'environment' } },
          },
          false,
        )
        scanner.render(
          (decoded) => handleResult(decoded),
          () => {}, // ignore per-frame "QR not found" errors
        )
        scannerRef.current = scanner
      } catch (err) {
        setScanning(false)
        setCameraError(err?.message || 'Could not start the camera')
      }
    }, 30)
  }

  useEffect(() => () => { cleanup() }, [])

  const submitManual = (e) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleResult(manualCode.trim())
    setManualCode('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card-elevated">
        <h2 className="section-title mb-2">Camera scanner</h2>
        <p className="muted mb-4">
          Point the camera at the resident's ticket QR. The browser will ask
          for camera permission the first time.
        </p>

        <div
          id={elementId}
          className="rounded-xl overflow-hidden bg-gray-900 min-h-[280px] flex items-center justify-center text-gray-300"
        >
          {!scanning && <span className="text-sm">Camera idle</span>}
        </div>

        {cameraError && (
          <p className="mt-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
            {cameraError}
          </p>
        )}

        <div className="mt-4 flex gap-3">
          {!scanning ? (
            <button className="btn btn-primary" onClick={start}>Start camera</button>
          ) : (
            <button className="btn btn-secondary" onClick={cleanup}>Stop</button>
          )}
        </div>
      </div>

      <div className="card-elevated">
        <h2 className="section-title mb-2">Manual entry</h2>
        <p className="muted mb-4">Type or paste a ticket id / scanned payload.</p>
        <form onSubmit={submitManual} className="flex gap-2">
          <input
            className="input-field font-mono"
            placeholder="TICKET:xxxx-xxxx-..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Verify</button>
        </form>

        {lastResult && (
          <div
            className={`mt-6 rounded-lg p-4 border ${
              lastResult.kind === 'verified'
                ? 'border-emerald-200 bg-emerald-50'
                : lastResult.kind === 'already_used'
                ? 'border-amber-200 bg-amber-50'
                : 'border-rose-200 bg-rose-50'
            }`}
          >
            {lastResult.kind === 'verified' && (
              <>
                <p className="font-semibold text-emerald-800">Verified ✓</p>
                <p className="text-sm text-emerald-900 mt-1">
                  {lastResult.ticket.event_name} — {lastResult.ticket.ticket_type === 'veg' ? 'Veg' : 'Non-Veg'}
                </p>
                <p className="muted mt-1">Used at {fmtDate(lastResult.ticket.used_at)}</p>
                <p className="font-mono text-xs text-gray-500 mt-2 break-all">{lastResult.ticket.id}</p>
              </>
            )}
            {lastResult.kind === 'already_used' && (
              <>
                <p className="font-semibold text-amber-800">Already used ⚠</p>
                <p className="text-sm text-amber-900 mt-1">{lastResult.detail}</p>
              </>
            )}
            {lastResult.kind === 'error' && (
              <>
                <p className="font-semibold text-rose-800">Not verified</p>
                <p className="text-sm text-rose-900 mt-1">{lastResult.detail}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
