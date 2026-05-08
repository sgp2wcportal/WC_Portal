import React from 'react'
import { Smartphone, Monitor } from 'lucide-react'

import { useViewModeStore } from '../store/viewModeStore'

/**
 * Slide-switch in the header that flips the layout between "Computer" (default)
 * and "Mobile compatible" view. The actual layout response is in index.css —
 * see the html[data-view="mobile"] block.
 */
export const ViewModeToggle = ({ compact = false }) => {
  const mode = useViewModeStore((s) => s.mode)
  const setMode = useViewModeStore((s) => s.setMode)
  const isMobile = mode === 'mobile'

  return (
    <button
      type="button"
      onClick={() => setMode(isMobile ? 'desktop' : 'mobile')}
      role="switch"
      aria-checked={isMobile}
      title={isMobile ? 'Switch to Computer view' : 'Switch to Mobile compatible view'}
      className="inline-flex items-center gap-2 px-2 py-1.5 rounded-full bg-white border border-ink-200 hover:border-saffron-300 hover:shadow-sm transition-all"
    >
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isMobile ? 'text-ink-400' : 'text-ink-700'}`}>
        <Monitor className="w-3.5 h-3.5" />
        {!compact && <span className="hidden md:inline">Computer</span>}
      </span>
      <span
        className={`relative w-9 h-5 rounded-full transition-colors ${isMobile ? 'bg-saffron-500' : 'bg-ink-200'}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isMobile ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'}`}
        />
      </span>
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isMobile ? 'text-saffron-700' : 'text-ink-400'}`}>
        {!compact && <span className="hidden md:inline">Mobile</span>}
        <Smartphone className="w-3.5 h-3.5" />
      </span>
    </button>
  )
}
