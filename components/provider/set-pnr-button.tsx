'use client'

import { useState } from 'react'
import { Hash, Ticket, Loader2, CheckCircle2 } from 'lucide-react'

type Props = {
  bookingId: string
  initialPnr?: string | null
  initialTicket?: string | null
}

export function SetPnrButton({ bookingId, initialPnr, initialTicket }: Props) {
  const [open, setOpen] = useState(false)
  const [pnr, setPnr] = useState(initialPnr ?? '')
  const [ticket, setTicket] = useState(initialTicket ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/bookings/${bookingId}/pnr`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnr_code: pnr || null, ticket_number: ticket || null }),
      })
      setSaved(true)
      setTimeout(() => { setSaved(false); setOpen(false) }, 1000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Hash className="h-3.5 w-3.5" />
        PNR
        {initialPnr && <span className="text-accent">✓</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Hash className="h-4 w-4 text-accent" />
              إدخال بيانات التذكرة / Ticket Info
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  رقم الحجز (PNR / Booking Code)
                </label>
                <div className="relative">
                  <Hash className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={pnr}
                    onChange={e => setPnr(e.target.value.toUpperCase())}
                    placeholder="e.g. ABC123"
                    className="w-full rounded-lg border border-input bg-surface ps-9 pe-4 py-2.5 text-sm font-mono tracking-widest outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  رقم التذكرة / Ticket Number
                </label>
                <div className="relative">
                  <Ticket className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={ticket}
                    onChange={e => setTicket(e.target.value)}
                    placeholder="e.g. 176-1234567890"
                    className="w-full rounded-lg border border-input bg-surface ps-9 pe-4 py-2.5 text-sm font-mono tracking-widest outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-muted/30 transition-colors"
              >
                إلغاء / Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-1 rounded-lg bg-primary text-white py-2.5 text-sm font-bold disabled:opacity-60 transition-colors hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {saved ? (
                  <><CheckCircle2 className="h-4 w-4" /> تم</>
                ) : saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : 'حفظ / Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
