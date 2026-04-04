'use client'

import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { FLIGHT_REQUEST_STATUS_COLORS, TRIP_REQUEST_OFFER_STATUS_COLORS, CABIN_CLASSES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlaneTakeoff, Loader2, Send, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

type MyOffer = {
  id: string
  price_per_seat: number
  total_price: number
  notes: string | null
  status: string
  created_at: string
}

type AvailableRequest = {
  id: string
  name: string
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  seats_needed: number
  cabin_class: string
  budget_max: number | null
  notes: string | null
  status: string
  created_at: string
  my_offer: MyOffer | null
}

export default function ProviderTripRequestsPage() {
  const locale = useLocale()
  const t = useTranslations('trip_requests')
  const isAr = locale === 'ar'

  const [requests, setRequests] = useState<AvailableRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [offerForms, setOfferForms] = useState<Record<string, { price: string; notes: string }>>({})
  const [submittingOffer, setSubmittingOffer] = useState<string | null>(null)
  const [successOffer, setSuccessOffer] = useState<string | null>(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/trip-requests/available')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const toggleOfferForm = (requestId: string) => {
    setOfferForms((prev) => {
      if (prev[requestId]) {
        const next = { ...prev }
        delete next[requestId]
        return next
      }
      return { ...prev, [requestId]: { price: '', notes: '' } }
    })
  }

  const submitOffer = async (requestId: string) => {
    const form = offerForms[requestId]
    if (!form || !form.price) return

    setSubmittingOffer(requestId)
    try {
      const res = await fetch(`/api/trip-requests/${requestId}/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_per_seat: Number(form.price),
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        setSuccessOffer(requestId)
        setOfferForms((prev) => {
          const next = { ...prev }
          delete next[requestId]
          return next
        })
        setTimeout(() => setSuccessOffer(null), 3000)
        fetchRequests()
      }
    } catch {
      // silently fail
    } finally {
      setSubmittingOffer(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('provider_title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('provider_desc')}</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <PlaneTakeoff className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">{t('provider_empty')}</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-slate-900">{req.origin} → {req.destination}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', FLIGHT_REQUEST_STATUS_COLORS[req.status] || 'bg-muted text-muted-foreground')}>
                      {t(`status_${req.status}` as 'status_pending')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">{isAr ? 'التاريخ' : 'Date'}: </span>
                      <span className="font-medium text-slate-900">{req.departure_date}</span>
                    </div>
                    {req.return_date && (
                      <div>
                        <span className="text-slate-500">{isAr ? 'العودة' : 'Return'}: </span>
                        <span className="font-medium text-slate-900">{req.return_date}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">{isAr ? 'المقاعد' : 'Seats'}: </span>
                      <span className="font-medium text-slate-900">{req.seats_needed}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{isAr ? 'الدرجة' : 'Class'}: </span>
                      <span className="font-medium text-slate-900">{CABIN_CLASSES[req.cabin_class as keyof typeof CABIN_CLASSES]?.[isAr ? 'ar' : 'en'] || req.cabin_class}</span>
                    </div>
                  </div>
                  {req.notes && (
                    <p className="mt-2 text-xs text-slate-500">{req.notes}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {req.my_offer ? (
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-500 mb-1">{t('your_offer')}</p>
                      <span className={cn('px-3 py-1 rounded-full text-xs font-bold', TRIP_REQUEST_OFFER_STATUS_COLORS[req.my_offer.status])}>
                        {req.my_offer.price_per_seat.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => toggleOfferForm(req.id)}
                        className="rounded-lg text-xs font-bold px-4"
                      >
                        {t('make_offer')}
                      </Button>
                      <Link href={`/${locale}/provider/trips/new?origin=${encodeURIComponent(req.origin)}&destination=${encodeURIComponent(req.destination)}&departure=${req.departure_date}&seats=${req.seats_needed}&cabin=${req.cabin_class}&flight_request_id=${req.id}`}>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs font-bold px-4 w-full gap-1.5">
                          <ExternalLink className="h-3 w-3" />
                          {t('create_trip')}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {successOffer === req.id && (
                <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700 font-medium">
                  {t('offer_submitted')}
                </div>
              )}

              {offerForms[req.id] && !req.my_offer && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{t('price_per_seat')} ({isAr ? 'ر.س' : 'SAR'})</Label>
                      <Input
                        type="number"
                        min={1}
                        value={offerForms[req.id].price}
                        onChange={(e) => setOfferForms((prev) => ({ ...prev, [req.id]: { ...prev[req.id], price: e.target.value } }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{t('provider_notes')} <span className="font-normal normal-case text-muted-foreground">({isAr ? 'اختياري' : 'optional'})</span></Label>
                      <Textarea
                        rows={1}
                        value={offerForms[req.id].notes}
                        onChange={(e) => setOfferForms((prev) => ({ ...prev, [req.id]: { ...prev[req.id], notes: e.target.value } }))}
                        className="resize-none min-h-[40px]"
                      />
                    </div>
                  </div>
                  {offerForms[req.id].price && (
                    <p className="mt-2 text-sm text-slate-600">
                      {t('total_price')}: <span className="font-bold text-sky-600">{(Number(offerForms[req.id].price) * req.seats_needed).toLocaleString()} {isAr ? 'ر.س' : 'SAR'}</span>
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => submitOffer(req.id)}
                      disabled={submittingOffer === req.id || !offerForms[req.id].price}
                      className="rounded-lg text-xs font-bold px-4 gap-2"
                    >
                      {submittingOffer === req.id ? <><Loader2 className="h-3 w-3 animate-spin" />{t('submitting_offer')}</> : <><Send className="h-3 w-3" />{t('make_offer')}</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleOfferForm(req.id)}
                      className="rounded-lg text-xs font-bold px-4"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
