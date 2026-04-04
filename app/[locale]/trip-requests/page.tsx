'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { z } from 'zod'
import { format } from 'date-fns'
import { arSA } from 'date-fns/locale'
import Link from 'next/link'
import { getFlightRequestSchema } from '@/lib/validations'
import { FLIGHT_REQUEST_STATUS_COLORS, TRIP_REQUEST_OFFER_STATUS_COLORS } from '@/lib/constants'
import { useUser } from '@/hooks/use-user'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  PlaneTakeoff,
  Send,
  Loader2,
  CheckCircle2,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  LogIn,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FormData = z.infer<ReturnType<typeof getFlightRequestSchema>>

type Offer = {
  id: string
  provider_id: string
  price_per_seat: number
  total_price: number
  notes: string | null
  status: string
  created_at: string
  provider?: {
    id: string
    company_name_ar: string | null
    company_name_en: string | null
    logo_url: string | null
  }
}

type FlightRequest = {
  id: string
  origin: string
  destination: string
  departure_date: string
  return_date: string | null
  seats_needed: number
  cabin_class: string
  status: string
  created_at: string
  offers: Offer[]
}

function DatePickerField({
  value,
  onChange,
  placeholder,
  isAr,
  hasError,
  disabled,
}: {
  value: string | undefined
  onChange: (val: string) => void
  placeholder: string
  isAr: boolean
  hasError?: boolean
  disabled?: { before: Date }
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? new Date(value + 'T00:00:00') : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20',
          !selected && 'text-muted-foreground'
        )}
        aria-invalid={hasError || undefined}
      >
        <span>
          {selected
            ? format(selected, 'PPP', { locale: isAr ? arSA : undefined })
            : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={isAr ? 'end' : 'start'}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'))
              setOpen(false)
            }
          }}
          disabled={disabled}
          locale={isAr ? arSA : undefined}
          captionLayout="dropdown"
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default function TripRequestsPage() {
  const locale = useLocale()
  const t = useTranslations('trip_requests')
  const tHome = useTranslations('homepage')
  const isAr = locale === 'ar'
  const { user, profile, loading: userLoading } = useUser()

  const [tab, setTab] = useState<'submit' | 'requests'>('submit')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [requests, setRequests] = useState<FlightRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const schema = getFlightRequestSchema(isAr ? 'ar' : 'en')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { seats_needed: 1, cabin_class: 'economy' },
  })

  useEffect(() => {
    if (profile) {
      if (profile.full_name) setValue('name', profile.full_name)
      if (profile.email) setValue('email', profile.email)
      if (profile.phone) setValue('phone', profile.phone)
    }
  }, [profile, setValue])

  const fetchRequests = async () => {
    setLoadingRequests(true)
    try {
      const res = await fetch('/api/trip-requests/mine')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    if (user && tab === 'requests') {
      fetchRequests()
    }
  }, [user, tab])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/trip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSubmitted(true)
        reset()
      } else {
        const body = await res.json()
        setError(body.error || (isAr ? 'حدث خطأ' : 'Something went wrong'))
      }
    } catch {
      setError(isAr ? 'خطأ في الاتصال' : 'Connection error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOfferAction = async (requestId: string, offerId: string, action: 'accept' | 'reject') => {
    setActionLoading(offerId)
    try {
      const res = await fetch(`/api/trip-requests/${requestId}/offer/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        fetchRequests()
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (userLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-start justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-start gap-6 px-4">
        <PlaneTakeoff className="h-16 w-16 text-amber-500" />
        <h1 className="text-2xl font-black text-slate-900">{t('page_title')}</h1>
        <p className="text-slate-500 text-center max-w-md">{t('login_required')}</p>
        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:brightness-95 transition-all"
        >
          <LogIn className="h-4 w-4" />
          {t('login_button')}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 uppercase tracking-widest mb-4">
          <PlaneTakeoff className="h-3.5 w-3.5" />
          {t('page_title')}
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('page_title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 justify-center">
        <button
          onClick={() => setTab('submit')}
          className={cn(
            'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
            tab === 'submit'
              ? 'bg-primary text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {t('tab_submit')}
        </button>
        <button
          onClick={() => setTab('requests')}
          className={cn(
            'px-6 py-2.5 rounded-xl text-sm font-bold transition-all',
            tab === 'requests'
              ? 'bg-primary text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {t('tab_my_requests')}
        </button>
      </div>

      {/* Submit Tab */}
      {tab === 'submit' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">{tHome('flight_request_success_title')}</h3>
              <p className="text-slate-500 max-w-sm font-medium">{tHome('flight_request_success_desc')}</p>
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="secondary"
                  className="rounded-xl px-6 h-11 text-sm font-bold"
                >
                  {tHome('flight_request_new')}
                </Button>
                <Button
                  onClick={() => { setSubmitted(false); setTab('requests') }}
                  className="rounded-xl px-6 h-11 text-sm font-bold"
                >
                  {t('tab_my_requests')}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-10">
              <div className="mb-6">
                <h2 className="text-xl font-black text-slate-900">{t('submit_title')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('submit_desc')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_origin')}</Label>
                  <Input {...register('origin')} placeholder={isAr ? 'مثال: الرياض' : 'e.g. Riyadh'} aria-invalid={!!errors.origin} />
                  {errors.origin && <p className="text-xs text-destructive">{errors.origin.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_destination')}</Label>
                  <Input {...register('destination')} placeholder={isAr ? 'مثال: القاهرة' : 'e.g. Cairo'} aria-invalid={!!errors.destination} />
                  {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_departure')}</Label>
                  <Controller name="departure_date" control={control} render={({ field }) => (
                    <DatePickerField value={field.value} onChange={field.onChange} placeholder={isAr ? 'اختر تاريخ المغادرة' : 'Pick departure date'} isAr={isAr} hasError={!!errors.departure_date} disabled={{ before: today }} />
                  )} />
                  {errors.departure_date && <p className="text-xs text-destructive">{errors.departure_date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_return')} <span className="font-normal normal-case text-muted-foreground">({tHome('flight_request_optional')})</span></Label>
                  <Controller name="return_date" control={control} render={({ field }) => (
                    <DatePickerField value={field.value} onChange={field.onChange} placeholder={isAr ? 'اختر تاريخ العودة' : 'Pick return date'} isAr={isAr} disabled={{ before: today }} />
                  )} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_seats')}</Label>
                  <Input {...register('seats_needed', { valueAsNumber: true })} type="number" min={1} max={20} aria-invalid={!!errors.seats_needed} />
                  {errors.seats_needed && <p className="text-xs text-destructive">{errors.seats_needed.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_cabin')}</Label>
                  <select {...register('cabin_class')} className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20">
                    <option value="economy">{tHome('flight_request_cabin_economy')}</option>
                    <option value="business">{tHome('flight_request_cabin_business')}</option>
                    <option value="first">{tHome('flight_request_cabin_first')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_name')}</Label>
                  <Input {...register('name')} aria-invalid={!!errors.name} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_phone')}</Label>
                  <Input {...register('phone')} type="tel" aria-invalid={!!errors.phone} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_email')}</Label>
                  <Input {...register('email')} type="email" aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_notes')} <span className="font-normal normal-case text-muted-foreground">({tHome('flight_request_optional')})</span></Label>
                  <Textarea {...register('notes')} rows={3} className="resize-none min-h-[76px]" />
                </div>
              </div>
              {error && (
                <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">{error}</div>
              )}
              <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={submitting} className="rounded-2xl px-8 h-12 text-sm font-bold gap-2.5 shadow-lg">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{tHome('flight_request_submitting')}</> : <><Send className="h-4 w-4" />{tHome('flight_request_submit')}</>}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* My Requests Tab */}
      {tab === 'requests' && (
        <div className="space-y-4">
          {loadingRequests ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-12 text-center">
              <PlaneTakeoff className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('my_requests_empty')}</h3>
              <p className="text-sm text-slate-500 mb-6">{t('my_requests_empty_desc')}</p>
              <Button onClick={() => setTab('submit')} className="rounded-xl px-6 h-11 text-sm font-bold">
                {t('tab_submit')}
              </Button>
            </div>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-900">{req.origin} → {req.destination}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', FLIGHT_REQUEST_STATUS_COLORS[req.status] || 'bg-muted text-muted-foreground')}>
                        {t(`status_${req.status}` as 'status_pending')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{req.departure_date}</span>
                      <span>{req.seats_needed} {isAr ? 'مقاعد' : 'seats'}</span>
                      <span>{req.cabin_class}</span>
                      {req.offers.length > 0 && (
                        <span className="text-amber-600 font-bold">{t('offers_count', { count: req.offers.length })}</span>
                      )}
                    </div>
                  </div>
                  {expandedRequest === req.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                </div>

                {expandedRequest === req.id && (
                  <div className="border-t border-slate-100 p-5">
                    {req.offers.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">{t('no_offers')}</p>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-700">{t('offers_title')}</h4>
                        {req.offers.map((offer) => (
                          <div key={offer.id} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-slate-900">
                                    {t('offer_from')} {isAr ? offer.provider?.company_name_ar : (offer.provider?.company_name_en || offer.provider?.company_name_ar)}
                                  </span>
                                  <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', TRIP_REQUEST_OFFER_STATUS_COLORS[offer.status] || 'bg-muted text-muted-foreground')}>
                                    {t(`offer_status_${offer.status}` as 'offer_status_pending')}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-slate-500">{t('price_per_seat')}: </span>
                                    <span className="font-bold text-slate-900">{offer.price_per_seat.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">{t('total_price')}: </span>
                                    <span className="font-bold text-sky-600">{offer.total_price.toLocaleString()} {isAr ? 'ر.س' : 'SAR'}</span>
                                  </div>
                                </div>
                                {offer.notes && (
                                  <p className="mt-2 text-xs text-slate-500"><span className="font-medium">{t('provider_notes')}:</span> {offer.notes}</p>
                                )}
                              </div>
                              {offer.status === 'pending' && (
                                <div className="flex flex-col gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleOfferAction(req.id, offer.id, 'accept')}
                                    disabled={actionLoading === offer.id}
                                    className="rounded-lg text-xs font-bold px-4"
                                  >
                                    {actionLoading === offer.id ? t('accepting') : t('accept_offer')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOfferAction(req.id, offer.id, 'reject')}
                                    disabled={actionLoading === offer.id}
                                    className="rounded-lg text-xs font-bold px-4"
                                  >
                                    {actionLoading === offer.id ? t('rejecting') : t('reject_offer')}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
