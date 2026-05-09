import React, { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Check, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'

import { paymentService } from '../services/paymentService'

const fmtINR = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export const UpiPaymentPanel = ({ amount, note, title = 'Pay via UPI', subtitle = 'Scan with any UPI app to pay the committee.' }) => {
  const [info, setInfo] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    paymentService
      .upiInfo(amount && Number(amount) > 0 ? Number(amount) : null, note || null)
      .then((r) => { if (!cancelled) setInfo(r.data) })
      .catch(() => { if (!cancelled) setInfo(null) })
    return () => { cancelled = true }
  }, [amount, note])

  const copy = async () => {
    if (!info?.upi_id) return
    try {
      await navigator.clipboard.writeText(info.upi_id)
      setCopied(true)
      toast.success('UPI ID copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="card-elevated relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-saffron-100 -z-0" />
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-saffron-200 -z-0" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <QrCode className="w-4 h-4 text-saffron-600" />
          <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
        </div>
        <p className="muted mb-4">{subtitle}</p>

        <div className="flex items-center justify-center bg-white border border-ink-100 rounded-2xl p-4 shadow-soft">
          {info ? (
            <QRCodeCanvas value={info.upi_uri} size={196} includeMargin />
          ) : (
            <div className="w-[196px] h-[196px] skeleton" />
          )}
        </div>

        <div className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-ink-500">UPI ID</span>
            <button
              onClick={copy}
              className="font-mono text-ink-900 hover:text-saffron-700 inline-flex items-center gap-1.5 group"
              disabled={!info?.upi_id}
              title="Click to copy"
            >
              {info?.upi_id || '—'}
              {info?.upi_id && (
                copied
                  ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                  : <Copy className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
              )}
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Committee</span>
            <span className="text-ink-900 font-medium">Welfare Committee@SGP2</span>
          </div>
          {amount > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-500">Amount</span>
              <span className="font-semibold text-emerald-700">{fmtINR(amount)}</span>
            </div>
          )}
          {note && (
            <div className="flex justify-between">
              <span className="text-ink-500">Note</span>
              <span className="text-ink-900 text-right truncate max-w-[60%]" title={note}>{note}</span>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-saffron-800 bg-saffron-50 border border-saffron-100 rounded-lg p-2.5 leading-relaxed">
          After paying, save the UPI transaction ID. Once the committee admin sees the
          transfer in the bank account, they'll mark your record as verified.
        </p>
      </div>
    </div>
  )
}
