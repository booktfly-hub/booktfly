'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Loader2, X, UserCog } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  bookingId: string
  passengerIndex: number
  currentFirstName: string
  currentLastName: string
  fee: number
  refundable: boolean
  currency?: string
  guestToken?: string
  onSuccess: () => void
  targetType?: 'booking' | 'room_booking' | 'car_booking' | 'package_booking'
}

export function ChangeNameModal({
  open,
  onClose,
  bookingId,
  passengerIndex,
  currentFirstName,
  currentLastName,
  fee,
  refundable,
  currency = 'SAR',
  guestToken,
  onSuccess,
  targetType = 'booking',
}: Props) {
  const t = useTranslations()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [firstName, setFirstName] = useState(currentFirstName)
  const [lastName, setLastName] = useState(currentLastName)
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const canSubmit =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    (firstName.trim() !== currentFirstName || lastName.trim() !== currentLastName)

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/change-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passenger_index: passengerIndex,
          new_first_name: firstName.trim(),
          new_last_name: lastName.trim(),
          guest_token: guestToken,
          target_type: targetType,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: result.error || t('common.error'), variant: 'destructive' })
        return
      }
      toast({ title: isAr ? 'تم تحديث الاسم' : 'Name updated', variant: 'success' })
      onSuccess()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold">{t('name_change.request')}</h3>
              <p className="text-xs text-muted-foreground">
                {isAr ? 'تحديث اسم المسافر على هذا الحجز' : 'Update the passenger name on this booking'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label={t('common.close')}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-xs">
          <p className="font-bold text-slate-700">{t('name_change.fee_label')}</p>
          <p className="mt-1 text-sm font-black text-foreground">
            {fee > 0
              ? `${fee} ${currency} ${refundable ? `(${t('name_change.refundable')})` : `(${t('name_change.non_refundable')})`}`
              : t('name_change.free')}
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-bold">{isAr ? 'الاسم الأول الجديد' : 'New first name'}</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold">{isAr ? 'الاسم الأخير الجديد' : 'New last name'}</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              dir="ltr"
              className="w-full rounded-xl border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className={cn(
              'flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all inline-flex items-center justify-center gap-2',
              canSubmit && !submitting
                ? 'bg-primary text-white shadow-md hover:brightness-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            )}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAr ? 'تأكيد التغيير' : 'Confirm change'}
          </button>
        </div>
      </div>
    </div>
  )
}
