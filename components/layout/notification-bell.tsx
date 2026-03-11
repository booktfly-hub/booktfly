'use client'

import { Bell } from 'lucide-react'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useNotifications } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import Link from 'next/link'

type Props = {
  userId: string
}

export function NotificationBell({ userId }: Props) {
  const t = useTranslations('notifications')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(userId)

  const getNotificationLink = (data: Record<string, string> | null): string | null => {
    if (!data) return null
    if (data.booking_id) return `/${locale}/my-bookings/${data.booking_id}`
    if (data.trip_id) return `/${locale}/trips/${data.trip_id}`
    if (data.application_id) return `/${locale}/become-provider/status`
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 mt-2 w-80 rounded-lg bg-white border shadow-lg z-20 max-h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold text-sm">{t('title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-accent hover:underline"
                >
                  {t('mark_all_read')}
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  {t('no_notifications')}
                </p>
              ) : (
                notifications.map((n) => {
                  const link = getNotificationLink(n.data)
                  const title = locale === 'ar' ? n.title_ar : n.title_en
                  const body = locale === 'ar' ? n.body_ar : n.body_en
                  const timeAgo = formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: locale === 'ar' ? ar : enUS,
                  })

                  const content = (
                    <div
                      className={`p-3 border-b hover:bg-muted/50 transition-colors cursor-pointer ${
                        !n.read ? 'bg-accent/5' : ''
                      }`}
                      onClick={() => {
                        markAsRead(n.id)
                        setOpen(false)
                      }}
                    >
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                    </div>
                  )

                  return link ? (
                    <Link key={n.id} href={link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
