'use client'

import { Bell, CheckCheck, Inbox } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useNotifications } from '@/hooks/use-notifications'
import { useUser } from '@/hooks/use-user'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

type Props = {
  userId: string
}

export function NotificationBell({ userId }: Props) {
  const t = useTranslations('notifications')
  const locale = useLocale()
  const pathname = usePathname()
  const { supabase } = useUser()
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications(userId, supabase)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label={t('title')}
        aria-expanded={open}
        aria-controls={menuId}
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
          <div
            id={menuId}
            className="absolute end-0 mt-2 w-80 rounded-xl bg-card border shadow-xl z-20 flex flex-col overflow-hidden"
            aria-label={t('title')}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">{t('title')}</h3>
                {unreadCount > 0 && (
                  <span className="h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t('mark_all_read')}
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-80 divide-y">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('no_notifications')}</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => {
                  const title = locale === 'ar' ? n.title_ar : n.title_en
                  const body = locale === 'ar' ? n.body_ar : n.body_en
                  const timeAgo = formatDistanceToNow(new Date(n.created_at), {
                    addSuffix: true,
                    locale: locale === 'ar' ? ar : enUS,
                  })

                  return (
                    <Link
                      key={n.id}
                      href={`/${locale}/notifications/${n.id}`}
                      className={cn(
                        'block px-4 py-3 hover:bg-muted/60 transition-colors',
                        !n.read && 'bg-primary/[0.04]'
                      )}
                      onClick={() => {
                        markAsRead(n.id)
                        setOpen(false)
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        {!n.read && (
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                        <div className={cn('flex-1 min-w-0', n.read && 'ms-4.5')}>
                          <p className={cn('text-sm leading-snug', !n.read ? 'font-semibold' : 'font-medium')}>
                            {title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{body}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            <Link
              href={`/${locale}/notifications`}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 border-t text-center text-sm font-bold text-primary hover:bg-muted/50 transition-colors"
            >
              {t('view_all')}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
