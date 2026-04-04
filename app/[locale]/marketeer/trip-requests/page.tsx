'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { z } from 'zod'
import { format } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { getFlightRequestSchema } from '@/lib/validations'
import { FLIGHT_REQUEST_STATUS_COLORS } from '@/lib/constants'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PlaneTakeoff, Send, Loader2, CheckCircle2, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type FormData = z.infer<ReturnType<typeof getFlightRequestSchema>>

type FlightRequestItem = {
  id: string
  name: string
  origin: string
  destination: string
  departure_date: string
  seats_needed: number
  cabin_class: string
  status: string
  created_at: string
  offers: unknown[]
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
          {selected ? format(selected, 'PPP', { locale: isAr ? arSA : undefined }) : placeholder}
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

export default function MarkeeteerTripRequestsPage() {
  const locale = useLocale()
  const t = useTranslations('trip_requests')
  const tHome = useTranslations('homepage')
  const isAr = locale === 'ar'

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [requests, setRequests] = useState<FlightRequestItem[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  const schema = getFlightRequestSchema(isAr ? 'ar' : 'en')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { seats_needed: 1, cabin_class: 'economy' },
  })

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
    fetchRequests()
  }, [])

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
        fetchRequests()
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('marketeer_title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('marketeer_desc')}</p>
      </div>

      {/* Submit form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{tHome('flight_request_success_title')}</h3>
            <p className="text-slate-500 text-sm max-w-sm">{tHome('flight_request_success_desc')}</p>
            <Button onClick={() => setSubmitted(false)} variant="secondary" className="mt-6 rounded-xl px-6 h-10 text-sm font-bold">
              {tHome('flight_request_new')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{t('customer_name')}</Label>
                <Input {...register('name')} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{t('customer_phone')}</Label>
                <Input {...register('phone')} type="tel" aria-invalid={!!errors.phone} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{t('customer_email')}</Label>
                <Input {...register('email')} type="email" aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
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
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">{tHome('flight_request_notes')} <span className="font-normal normal-case text-muted-foreground">({tHome('flight_request_optional')})</span></Label>
                <Textarea {...register('notes')} rows={2} className="resize-none min-h-[60px]" />
              </div>
            </div>
            {error && (
              <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">{error}</div>
            )}
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={submitting} className="rounded-xl px-6 h-11 text-sm font-bold gap-2">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{tHome('flight_request_submitting')}</> : <><Send className="h-4 w-4" />{tHome('flight_request_submit')}</>}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* My submissions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">{t('my_submissions')}</h2>
        {loadingRequests ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <PlaneTakeoff className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">{t('my_requests_empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{req.origin} → {req.destination}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', FLIGHT_REQUEST_STATUS_COLORS[req.status] || 'bg-muted text-muted-foreground')}>
                        {t(`status_${req.status}` as 'status_pending')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{req.name}</span>
                      <span>{req.departure_date}</span>
                      <span>{req.seats_needed} {isAr ? 'مقاعد' : 'seats'}</span>
                      {req.offers.length > 0 && (
                        <span className="text-amber-600 font-bold">{t('offers_count', { count: req.offers.length })}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
