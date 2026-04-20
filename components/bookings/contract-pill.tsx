'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { FileSignature, Printer } from 'lucide-react'

type TargetType = 'booking' | 'room_booking' | 'car_booking' | 'package_booking'

type Props = {
  signedAt: string | null | undefined
  targetType: TargetType
  bookingId: string
}

export function ContractPill({ signedAt, targetType, bookingId }: Props) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  if (!signedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-500 border border-slate-200">
        {isAr ? 'غير موقّع' : 'Unsigned'}
      </span>
    )
  }

  return (
    <Link
      href={`/${locale}/contracts/print/${targetType}/${bookingId}`}
      target="_blank"
      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
      title={new Date(signedAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
    >
      <FileSignature className="h-3 w-3" />
      {isAr ? 'موقّع' : 'Signed'}
      <Printer className="h-3 w-3 opacity-70" />
    </Link>
  )
}
