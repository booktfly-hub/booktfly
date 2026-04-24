'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { BOOKING_STATUS_COLORS } from '@/lib/constants'
import { ArrowRight } from 'lucide-react'
import { shortId, formatPrice, formatPriceEN } from '@/lib/utils'
import { SignatureDisplay } from '@/components/admin/signature-display'
import type { PackageBooking } from '@/types'

type LoadedBooking = PackageBooking & {
  package?: { name_ar: string; name_en: string | null; destination_city_ar: string | null; destination_city_en: string | null; total_price: number; currency: string } | null
  provider?: { company_name_ar: string; company_name_en: string | null } | null
}

export default function AdminPackageBookingDetail() {
  const { id } = useParams<{ id: string }>()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  const supabase = createClient()
  const [booking, setBooking] = useState<LoadedBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const isAr = locale === 'ar'

  useEffect(() => {
    async function fetchBooking() {
      const { data } = await supabase
        .from('package_bookings')
        .select('*, package:packages(name_ar, name_en, destination_city_ar, destination_city_en, total_price, currency), provider:providers(company_name_ar, company_name_en)')
        .eq('id', id)
        .single()
      setBooking(data as unknown as LoadedBooking)
      setLoading(false)
    }
    fetchBooking()
  }, [id, supabase])

  if (loading) return <div className="animate-pulse p-8">{t('common.loading')}</div>
  if (!booking) return <div className="p-8 text-muted-foreground">{t('errors.not_found')}</div>

  const currency = booking.package?.currency || 'SAR'
  const fmt = (n: number) => (isAr ? formatPrice(n, currency) : formatPriceEN(n, currency))
  const packageName = booking.package
    ? (isAr ? booking.package.name_ar : (booking.package.name_en || booking.package.name_ar))
    : '-'
  const destination = booking.package
    ? (isAr ? booking.package.destination_city_ar : (booking.package.destination_city_en || booking.package.destination_city_ar))
    : '-'
  const providerName = booking.provider
    ? (isAr ? booking.provider.company_name_ar : (booking.provider.company_name_en || booking.provider.company_name_ar))
    : '-'

  const timeline = [
    { label: pick(locale, 'تاريخ الحجز', 'Booking Date', 'Rezervasyon Tarihi'), value: booking.created_at },
    { label: pick(locale, 'تاريخ الدفع', 'Paid At', 'Ödeme Tarihi'), value: booking.paid_at },
    { label: pick(locale, 'تأكيد التحويل', 'Transfer Confirmed', 'Transfer Onaylandı'), value: booking.transfer_confirmed_at },
    { label: pick(locale, 'مراجعة الدفع', 'Payment Reviewed', 'Ödeme İncelendi'), value: booking.payment_reviewed_at },
    { label: pick(locale, 'تاريخ الإلغاء', 'Cancelled At', 'İptal Tarihi'), value: booking.cancelled_at },
    { label: pick(locale, 'تاريخ الاسترداد', 'Refunded At', 'İade Tarihi'), value: booking.refunded_at },
  ].filter((x) => x.value)

  return (
    <div className="max-w-3xl">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowRight className="h-4 w-4 rotate-180 rtl:rotate-0" />
        {t('common.back')}
      </button>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{pick(locale, 'تفاصيل حجز الباقة', 'Package Booking Detail', 'Paket Rezervasyon Detayı')}</h1>
              <p className="text-sm text-muted-foreground">#{shortId(booking.id)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${BOOKING_STATUS_COLORS[booking.status]}`}>
              {t(`status.${booking.status}`)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{pick(locale, 'معلومات الباقة', 'Package Info', 'Paket Bilgisi')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{pick(locale, 'اسم الباقة', 'Package', 'Paket')}</p>
              <p className="font-medium">{packageName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{pick(locale, 'الوجهة', 'Destination', 'Varış')}</p>
              <p className="font-medium">{destination}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t('admin.providers')}</p>
              <p className="font-medium">{providerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{pick(locale, 'عدد الأشخاص', 'People', 'Kişi')}</p>
              <p className="font-medium">{booking.number_of_people}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{pick(locale, 'تاريخ البدء', 'Start', 'Başlangıç')}</p>
              <p className="font-medium" dir="ltr">{booking.start_date}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{pick(locale, 'تاريخ الانتهاء', 'End', 'Bitiş')}</p>
              <p className="font-medium" dir="ltr">{booking.end_date}</p>
            </div>
          </div>
        </div>

        {/* Signed Contract */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{t('contract.step_title_client')}</h3>
          <SignatureDisplay
            signatureUrl={booking.buyer_signature_url}
            signedAt={booking.contract_signed_at}
            version={booking.contract_version}
            role="client"
            printTargetType="package_booking"
            printTargetId={booking.id}
            archiveUrl={booking.contract_archive_url}
          />
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{pick(locale, 'معلومات الضيف', 'Guest Info', 'Misafir Bilgisi')}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{pick(locale, 'اسم الضيف', 'Guest Name', 'Misafir Adı')}</p>
              <p className="font-medium">{booking.guest_name}</p>
            </div>
            {booking.guest_phone && (
              <div>
                <p className="text-muted-foreground">{pick(locale, 'الهاتف', 'Phone', 'Telefon')}</p>
                <p className="font-medium" dir="ltr">{booking.guest_phone}</p>
              </div>
            )}
            {booking.guest_email && (
              <div>
                <p className="text-muted-foreground">{pick(locale, 'البريد الإلكتروني', 'Email', 'E-posta')}</p>
                <p className="font-medium" dir="ltr">{booking.guest_email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold mb-3">{t('booking.payment_details')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('booking.total_amount')}</span>
              <span className="font-bold">{fmt(Number(booking.total_amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{pick(locale, 'العمولة', 'Commission', 'Komisyon')}</span>
              <span className="font-medium">{fmt(Number(booking.commission_amount))} ({booking.commission_rate}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{pick(locale, 'صافي المزود', 'Provider payout', 'Tedarikçi ödemesi')}</span>
              <span className="font-medium">{fmt(Number(booking.provider_payout))}</span>
            </div>
          </div>
        </div>

        {timeline.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold mb-3">{pick(locale, 'سير الحالة', 'Status Timeline', 'Durum Zaman Çizelgesi')}</h3>
            <ul className="space-y-2 text-sm">
              {timeline.map((item, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium" dir="ltr">{new Date(item.value as string).toLocaleString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
