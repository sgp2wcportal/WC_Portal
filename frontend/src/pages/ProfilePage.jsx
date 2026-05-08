import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, ShieldCheck, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react'

import { authService } from '../services/authService'
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

export const ProfilePage = () => {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    contact_number: '',
    tower: '',
    unit_number: '',
    is_rented: 'No',
    owner_name: '',
    owner_contact_number: '',
  })

  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [showPwd, setShowPwd] = useState(false)

  useEffect(() => {
    let cancelled = false
    authService.getMe()
      .then((r) => {
        if (cancelled) return
        const u = r.data
        setMe(u)
        setProfile({
          name: u.name || '',
          email: u.email || '',
          contact_number: u.contact_number || '',
          tower: u.tower || '',
          unit_number: u.unit_number || '',
          is_rented: u.is_rented ? 'Yes' : 'No',
          owner_name: u.owner_name || '',
          owner_contact_number: u.owner_contact_number || '',
        })
      })
      .catch(() => toast.error('Could not load your profile'))
      .finally(() => setLoading(false))
    return () => { cancelled = true }
  }, [])

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const r = await authService.updateMe({
        name: profile.name.trim(),
        email: profile.email.trim(),
        contact_number: profile.contact_number.trim(),
        tower: profile.tower || null,
        unit_number: profile.unit_number || null,
        is_rented: profile.is_rented === 'Yes',
        owner_name: profile.is_rented === 'Yes' ? (profile.owner_name.trim() || null) : null,
        owner_contact_number: profile.is_rented === 'Yes' ? (profile.owner_contact_number.trim() || null) : null,
      })
      setMe(r.data)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const savePwd = async (e) => {
    e.preventDefault()
    if (pwd.new_password !== pwd.confirm_password) {
      toast.error('New password and confirmation do not match')
      return
    }
    setSavingPwd(true)
    try {
      await authService.changePassword(pwd.current_password, pwd.new_password)
      setPwd({ current_password: '', new_password: '', confirm_password: '' })
      toast.success('Password updated')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not change password')
    } finally {
      setSavingPwd(false)
    }
  }

  if (loading) {
    return <div className="p-10 max-w-3xl mx-auto"><div className="card h-40 skeleton" /></div>
  }
  if (!me) return null

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hero relative"
      >
        <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-saffron-200/40 blur-3xl pointer-events-none" />
        <div className="relative">
          <p className="text-saffron-700 font-semibold text-xs uppercase tracking-[0.2em] mb-2 inline-flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Your account
          </p>
          <h1 className="display-title text-4xl">Profile & Security</h1>
          <p className="muted mt-1">
            Logged in as <span className="font-mono font-semibold text-ink-800">{me.username}</span> ·
            <span className="ml-1 capitalize">{me.role}</span>
          </p>
        </div>
      </motion.div>

      {/* Profile */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={saveProfile}
        className="card-elevated space-y-5"
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-saffron-600" />
          <h2 className="font-display text-lg font-semibold text-ink-900">Personal details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input className="input-field" required value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </Field>
          <Field label="Email ID" required>
            <input type="email" className="input-field" required value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          </Field>
          <Field label="Contact Number" required>
            <input type="tel" className="input-field" required value={profile.contact_number}
              onChange={(e) => setProfile({ ...profile, contact_number: e.target.value })} />
          </Field>
          <Field label="Tower" required>
            <select className="input-field" required value={profile.tower}
              onChange={(e) => setProfile({ ...profile, tower: e.target.value })}>
              <option value="">Select tower</option>
              {TOWERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Unit Number" required>
            <select className="input-field" required value={profile.unit_number}
              onChange={(e) => setProfile({ ...profile, unit_number: e.target.value })}>
              <option value="">Select unit</option>
              {UNIT_NUMBERS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Is this a rented flat?" required>
            <select className="input-field" required value={profile.is_rented}
              onChange={(e) => setProfile({ ...profile, is_rented: e.target.value })}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
        </div>

        {profile.is_rented === 'Yes' && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
            <p className="text-sm font-semibold text-indigo-800">
              Property owner details <span className="text-indigo-500 font-normal">(optional)</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Owner Name">
                <input className="input-field" value={profile.owner_name}
                  onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })} />
              </Field>
              <Field label="Owner Contact Number">
                <input type="tel" className="input-field" value={profile.owner_contact_number}
                  onChange={(e) => setProfile({ ...profile, owner_contact_number: e.target.value })} />
              </Field>
            </div>
          </div>
        )}

        <div>
          <button type="submit" disabled={savingProfile} className="btn btn-primary">
            <Sparkles className="w-4 h-4" />
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </motion.form>

      {/* Password */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={savePwd}
        className="card-elevated space-y-5"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-saffron-600" />
          <h2 className="font-display text-lg font-semibold text-ink-900">Change password</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Current password" required>
            <input
              type={showPwd ? 'text' : 'password'}
              className="input-field"
              required
              value={pwd.current_password}
              onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
            />
          </Field>
          <Field label="New password" required>
            <input
              type={showPwd ? 'text' : 'password'}
              className="input-field"
              required
              value={pwd.new_password}
              onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
            />
          </Field>
          <Field label="Confirm new password" required>
            <input
              type={showPwd ? 'text' : 'password'}
              className="input-field"
              required
              value={pwd.confirm_password}
              onChange={(e) => setPwd({ ...pwd, confirm_password: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={showPwd} onChange={(e) => setShowPwd(e.target.checked)} />
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            Show passwords
          </label>
          <button type="submit" disabled={savingPwd} className="btn btn-primary">
            <ShieldCheck className="w-4 h-4" />
            {savingPwd ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}
