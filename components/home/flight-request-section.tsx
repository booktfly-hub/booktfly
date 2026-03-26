'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocale, useTranslations } from 'next-intl'
import { z } from 'zod'
import { format } from 'date-fns'
import { arSA } from 'date-fns/locale'
import { getFlightRequestSchema } from '@/lib/validations'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Send, CheckCircle2, PlaneTakeoff, Loader2, CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type FormData = z.infer<ReturnType<typeof getFlightRequestSchema>>

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
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
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

export function FlightRequestSection() {
  const locale = useLocale()
  const t = useTranslations('homepage')
  const isAr = locale === 'ar'
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

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

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/flight-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSubmitted(true)
        reset()
      } else {
        const body = await res.json()
        setError(body.error || (isAr ? 'حدث خطأ، يرجى المحاولة مجدداً' : 'Something went wrong, please try again'))
      }
    } catch {
      setError(isAr ? 'خطأ في الاتصال، يرجى المحاولة مجدداً' : 'Connection error, please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#f0f9ff_0%,#e0f2fe_40%,#fef3c7_100%)]" />
      <div className="pointer-events-none absolute -top-32 -start-32 h-[500px] w-[500px] rounded-full bg-sky-300/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-32 -end-32 h-[400px] w-[400px] rounded-full bg-amber-300/20 blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-bold text-sky-700 uppercase tracking-widest shadow-sm mb-6">
            <PlaneTakeoff className="h-3.5 w-3.5" />
            {t('flight_request_label')}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {t('flight_request_title')}
          </h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">
            {t('flight_request_desc')}
          </p>
        </div>

        {/* card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] border border-slate-200/80 shadow-2xl shadow-slate-200/50 overflow-hidden">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">{t('flight_request_success_title')}</h3>
              <p className="text-slate-500 max-w-sm font-medium">{t('flight_request_success_desc')}</p>
              <Button
                onClick={() => setSubmitted(false)}
                variant="secondary"
                className="mt-8 rounded-xl px-6 h-11 text-sm font-bold"
              >
                {t('flight_request_new')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Origin */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_origin')}
                  </Label>
                  <Input
                    {...register('origin')}
                    placeholder={isAr ? 'مثال: الرياض' : 'e.g. Riyadh'}
                    aria-invalid={!!errors.origin}
                  />
                  {errors.origin && <p className="text-xs text-destructive">{errors.origin.message}</p>}
                </div>

                {/* Destination */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_destination')}
                  </Label>
                  <Input
                    {...register('destination')}
                    placeholder={isAr ? 'مثال: القاهرة' : 'e.g. Cairo'}
                    aria-invalid={!!errors.destination}
                  />
                  {errors.destination && <p className="text-xs text-destructive">{errors.destination.message}</p>}
                </div>

                {/* Departure date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_departure')}
                  </Label>
                  <Controller
                    name="departure_date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={isAr ? 'اختر تاريخ المغادرة' : 'Pick departure date'}
                        isAr={isAr}
                        hasError={!!errors.departure_date}
                        disabled={{ before: today }}
                      />
                    )}
                  />
                  {errors.departure_date && <p className="text-xs text-destructive">{errors.departure_date.message}</p>}
                </div>

                {/* Return date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_return')}{' '}
                    <span className="font-normal normal-case text-muted-foreground">({t('flight_request_optional')})</span>
                  </Label>
                  <Controller
                    name="return_date"
                    control={control}
                    render={({ field }) => (
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={isAr ? 'اختر تاريخ العودة' : 'Pick return date'}
                        isAr={isAr}
                        disabled={{ before: today }}
                      />
                    )}
                  />
                </div>

                {/* Seats */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_seats')}
                  </Label>
                  <Input
                    {...register('seats_needed', { valueAsNumber: true })}
                    type="number"
                    min={1}
                    max={20}
                    aria-invalid={!!errors.seats_needed}
                  />
                  {errors.seats_needed && <p className="text-xs text-destructive">{errors.seats_needed.message}</p>}
                </div>

                {/* Cabin class */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_cabin')}
                  </Label>
                  <select
                    {...register('cabin_class')}
                    className={cn(
                      'flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none',
                      'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20',
                      'disabled:cursor-not-allowed disabled:opacity-50'
                    )}
                  >
                    <option value="economy">{t('flight_request_cabin_economy')}</option>
                    <option value="business">{t('flight_request_cabin_business')}</option>
                    <option value="first">{t('flight_request_cabin_first')}</option>
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_name')}
                  </Label>
                  <Input
                    {...register('name')}
                    placeholder={isAr ? 'الاسم الكامل' : 'Full name'}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_phone')}
                  </Label>
                  <Input
                    {...register('phone')}
                    type="tel"
                    placeholder={isAr ? '05XXXXXXXX' : '+966 5X XXX XXXX'}
                    aria-invalid={!!errors.phone}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_email')}
                  </Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="example@email.com"
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                {/* Budget */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_budget')}{' '}
                    <span className="font-normal normal-case text-muted-foreground">({t('flight_request_optional')})</span>
                  </Label>
                  <Input
                    {...register('budget_max', { valueAsNumber: true })}
                    type="number"
                    min={0}
                    placeholder={isAr ? 'مثال: 1500' : 'e.g. 1500'}
                  />
                </div>

                {/* Notes - full width */}
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {t('flight_request_notes')}{' '}
                    <span className="font-normal normal-case text-muted-foreground">({t('flight_request_optional')})</span>
                  </Label>
                  <Textarea
                    {...register('notes')}
                    rows={3}
                    placeholder={t('flight_request_notes_placeholder')}
                    className="resize-none min-h-[76px]"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-2xl px-8 h-12 text-sm font-bold gap-2.5 shadow-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('flight_request_submitting')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      {t('flight_request_submit')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
