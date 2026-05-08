import { create } from 'zustand'

const STORAGE_KEY = 'view_mode'

const readStored = () => {
  if (typeof localStorage === 'undefined') return 'desktop'
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw === 'mobile' ? 'mobile' : 'desktop'
}

const applyToDom = (mode) => {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-view', mode)
}

const initial = readStored()
applyToDom(initial)

export const useViewModeStore = create((set) => ({
  mode: initial,
  setMode: (mode) => {
    const next = mode === 'mobile' ? 'mobile' : 'desktop'
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private mode etc. */ }
    applyToDom(next)
    set({ mode: next })
  },
  toggle: () => {
    const next = readStored() === 'mobile' ? 'desktop' : 'mobile'
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private mode etc. */ }
    applyToDom(next)
    set({ mode: next })
  },
}))
