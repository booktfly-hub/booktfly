'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import Link from 'next/link'
import type { Notification, NotificationType } from '@/types'
import {
  Bell,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Plane,
  CalendarX,
  ShieldAlert,
  CreditCard,
  RefreshCw,
  FileText,
  Edit3,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_CONFIG: Partial<Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
>> = {
  application_approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  application_rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  new_booking: { icon: Plane, color: 'text-primary', bg: 'bg-primary/10' },
  trip_removed: { icon: CalendarX, color: 'text-orange-600', bg: 'bg-orange-50' },
  account_suspended: { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10' },
  booking_confirmed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  payment_failed: { icon: CreditCard, color: 'text-destructive', bg: 'bg-destructive/10' },
  booking_refunded: { icon: RefreshCw, color: 'text-sky-600', bg: 'bg-sky-50' },
  booking_rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  new_application: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  provider_reapplied: { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
  trip_edit_approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  trip_edit_rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  trip_updated: { icon: Edit3, color: 'text-amber-600', bg: 'bg-amber-50' },
  cancellation_approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cancellation_rejected: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
}

function getNotificationLink(
  data: Record<string, string> | null,
  locale: string
): { href: string; labelAr: string; labelEn: string } | null {
  if (!data) return null
  if (data.booking_id)
    return {
      href: `/${locale}/my-bookings/${data.booking_id}`,
      labelAr: 'عرض الحجز',
      labelEn: 'View Booking',
    }
  if (data.room_booking_id)
    return {
      href: `/${locale}/my-bookings/rooms/${data.room_booking_id}`,
      labelAr: 'عرض حجز الغرفة',
      labelEn: 'View Room Booking',
    }
  if (data.car_booking_id)
    return {
      href: `/${locale}/my-bookings/cars/${data.car_booking_id}`,
      labelAr: 'عرض حجز السيارة',
      labelEn: 'View Car Booking',
    }
  if (data.trip_id)
    return {
      href: `/${locale}/trips/${data.trip_id}`,
      labelAr: 'عرض الرحلة',
      labelEn: 'View Trip',
    }
  if (data.application_id)
    return {
      href: `/${locale}/become-provider/status`,
      labelAr: 'عرض حالة الطلب',
      labelEn: 'View Application Status',
    }
  return null
}

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const t = useTranslations('notifications')

  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/${locale}/login`)
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setNotification(data)
      setLoading(false)

      if (!data.read) {
        await supabase.from('notifications').update({ read: true }).eq('id', id)
        setNotification((prev) => (prev ? { ...prev, read: true } : prev))
      }
    }
    load()
  }, [id])

  const BackArrow = isAr ? ArrowRight : ArrowLeft

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !notification) {
    return (
      <div className="max-w-xl mx-auto text-center py-32">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-bold mb-1">{isAr ? 'الإشعار غير موجود' : 'Notification not found'}</p>
        <p className="text-sm text-muted-foreground mb-6">
          {isAr ? 'ربما تم حذفه أو لا تملك صلاحية الوصول إليه.' : 'It may have been deleted or you may not have access.'}
        </p>
        <Link
          href={`/${locale}/notifications`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <BackArrow className="h-4 w-4" />
          {isAr ? 'العودة إلى الإشعارات' : 'Back to Notifications'}
        </Link>
      </div>
    )
  }

  const config = TYPE_CONFIG[notification.type] ?? {
    icon: Bell,
    color: 'text-primary',
    bg: 'bg-primary/10',
  }
  const Icon = config.icon
  const title = isAr ? notification.title_ar : notification.title_en
  const body = isAr ? notification.body_ar : notification.body_en
  const link = getNotificationLink(notification.data, locale)
  const formattedDate = format(new Date(notification.created_at), 'PPPp', {
    locale: isAr ? ar : enUS,
  })

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/notifications`}
          className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
        >
          <BackArrow className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{t('title')}</h1>
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center shrink-0', config.bg)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="font-bold text-base leading-snug">{title}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-5">
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{body}</p>
          </div>

          {link && (
            <div className="border-t pt-5">
              <Link
                href={link.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="h-4 w-4" />
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
