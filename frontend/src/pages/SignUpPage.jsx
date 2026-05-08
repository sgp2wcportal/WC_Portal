import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Sparkles, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react'

import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { TOWERS, UNIT_NUMBERS } from '../lib/society'

const Field = ({ label, required, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500"> *</span>}
    </span>
    {children}
    {hint && <p className="text-xs text-ink-500 mt-1">{hint}</p>}
  </label>
)

const empty = {
  name: '',
  email: '',
  contact_number: '',
  tower: '',
  unit_number: '',
  is_rented: 'No',
  owner_name: '',
  owner_contact_number: '',
  username: '',
  password: '',
  confirm_password: '',
}

export const SignUpPage = () => {
  const [form, setForm] = useState(empty)
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Password and confirmation do not match')
      return
    }
    setSubmitting(true)
    try {
      await authService.register({
        username: form.username.trim(),
        password: form.password,
        name: form.name.trim(),
        email: form.email.trim(),
        contact_number: form.contact_number.trim(),
        tower: form.tower,
        unit_number: form.unit_number,
        is_rented: form.is_rented === 'Yes',
        owner_name: form.is_rented === 'Yes' ? (form.owner_name.trim() || null) : null,
        owner_contact_number: form.is_rented === 'Yes' ? (form.owner_contact_number.trim() || null) : null,
      })
      // Auto-login so the user lands on the dashboard
      const loginResp = await authService.login(form.username.trim(), form.password)
      const { access_token, role } = loginResp.data
      setAuth(access_token, role, form.username.trim())
      setDone({ email: form.email })
      toast.success('Account created — welcome aboard!')
      setTimeout(() => navigate('/dashboard'), 1800)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Sign-up failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream py-10 px-4">
      <div className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-saffron-300/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[460px] h-[460px] rounded-full bg-indigo-300/30 blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-saffron-grad shadow-glow flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="font-display font-semibold text-ink-900 text-base tracking-tight">
              Siddha Galaxia · Phase 2
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
              Create your resident account
            </p>
          </div>
        </Link>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">
                You're in 🎉
              </h2>
              <p className="muted mt-2">
                We've sent your username and password to <b>{done.email}</b> so you have a copy
                for future reference. Redirecting you to the dashboard…
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated space-y-5"
            >
              <div>
                <p className="text-saffron-700 font-semibold text-xs uppercase tracking-[0.2em] mb-2">
                  Sign up
                </p>
                <h1 className="font-display text-3xl font-semibold text-ink-900 tracking-tight">
                  Register your flat
                </h1>
                <p className="muted mt-1">
                  One account per resident. After signing up you can pay your subscription,
                  book food coupons, and view only your own records.
                </p>
              </div>

              {/* About you */}
              <fieldset className="rounded-2xl border border-ink-100 bg-ink-50/30 p-4 space-y-4">
                <legend className="text-sm font-semibold text-ink-800 px-2">About you</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full Name" required>
                    <input className="input-field" required value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Email ID" required hint="We'll send your credentials here for safekeeping.">
                    <input type="email" className="input-field" required value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </Field>
                  <Field label="Contact Number" required>
                    <input type="tel" className="input-field" required value={form.contact_number}
                      onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                      placeholder="e.g. 9876543210" />
                  </Field>
                </div>
              </fieldset>

              {/* About your flat */}
              <fieldset className="rounded-2xl border border-ink-100 bg-ink-50/30 p-4 space-y-4">
                <legend className="text-sm font-semibold text-ink-800 px-2">About your flat</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Tower" required>
                    <select className="input-field" required value={form.tower}
                      onChange={(e) => setForm({ ...form, tower: e.target.value })}>
                      <option value="">Select tower</option>
                      {TOWERS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Unit Number" required>
                    <select className="input-field" required value={form.unit_number}
                      onChange={(e) => setForm({ ...form, unit_number: e.target.value })}>
                      <option value="">Select unit</option>
                      {UNIT_NUMBERS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Is this a rented flat?" required>
                    <select className="input-field" required value={form.is_rented}
                      onChange={(e) => setForm({ ...form, is_rented: e.target.value })}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </Field>
                </div>
                <AnimatePresence>
                  {form.is_rented === 'Yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                        <p className="text-sm font-semibold text-indigo-800">
                          Property owner details <span className="text-indigo-500 font-normal">(optional)</span>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Field label="Owner Name">
                            <input className="input-field" value={form.owner_name}
                              onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
                          </Field>
                          <Field label="Owner Contact Number">
                            <input type="tel" className="input-field" value={form.owner_contact_number}
                              onChange={(e) => setForm({ ...form, owner_contact_number: e.target.value })} />
                          </Field>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </fieldset>

              {/* Credentials */}
              <fieldset className="rounded-2xl border border-saffron-100 bg-saffron-50/40 p-4 space-y-4">
                <legend className="text-sm font-semibold text-saffron-800 px-2">Choose your login</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Username" required>
                    <input className="input-field font-mono" required minLength={3} maxLength={64} value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="e.g. rahul.ghosh" />
                  </Field>
                  <Field label="Password" required>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className="input-field pr-12"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-ink-700 rounded-md"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm password" required>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="input-field"
                      required
                      value={form.confirm_password}
                      onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                    />
                  </Field>
                </div>
                <p className="text-xs text-saffron-800">
                  Your password is up to you — there are no length or complexity restrictions on the portal.
                  We'll email it to <b>{form.email || 'your email'}</b> so you have a copy for future reference.
                </p>
              </fieldset>

              <div className="flex items-center justify-between gap-4 pt-2">
                <Link to="/" className="text-sm text-ink-600 hover:text-ink-900">
                  ← Back to sign in
                </Link>
                <button type="submit" disabled={submitting} className="btn btn-primary group">
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Creating account…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Create account
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
