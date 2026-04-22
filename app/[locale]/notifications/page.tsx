'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types'
import { Bell, Loader2, CheckCheck, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export default function NotificationsPage() {
  const t = useTranslations('notifications')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()

  const getNotificationLink = (n: Notification): string => {
    return `/${locale}/notifications/${n.id}`
  }

  const fetchNotifications = useCallback(async (offset = 0, currentFilter = filter) => {
    if (!userId) return
    const isInitial = offset === 0
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (currentFilter === 'unread') {
      query = query.eq('read', false)
    }

    const { data } = await query

    if (data) {
      if (isInitial) {
        setNotifications(data)
      } else {
        setNotifications((prev) => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    }

    if (isInitial) setLoading(false)
    else setLoadingMore(false)
  }, [userId, filter])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/${locale}/login`)
        return
      }
      setUserId(user.id)
    }
    init()
  }, [])

  useEffect(() => {
    if (userId) {
      setNotifications([])
      setHasMore(true)
      fetchNotifications(0, filter)
    }
  }, [userId, filter])

  async function markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
  }

  async function markAllAsRead() {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-6 md:pt-8 lg:pt-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            {t('mark_all_read')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-card border p-1.5 rounded-xl w-fit">
        {(['all', 'unread'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-bold transition-all',
              filter === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {t(tab)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 text-center flex flex-col items-center">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold mb-1">
            {filter === 'unread'
              ? (isAr ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications')
              : t('no_notifications')}
          </p>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'ستظهر إشعاراتك هنا' : 'Your notifications will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden divide-y">
          {notifications.map((n) => {
            const link = getNotificationLink(n)
            const title = locale === 'ar' ? n.title_ar : n.title_en
            const body = locale === 'ar' ? n.body_ar : n.body_en
            const timeAgo = formatDistanceToNow(new Date(n.created_at), {
              addSuffix: true,
              locale: locale === 'ar' ? ar : enUS,
            })

            return (
              <Link
                key={n.id}
                href={link}
                className={cn(
                  'block p-4 hover:bg-muted/50 transition-colors',
                  !n.read && 'bg-primary/[0.03]'
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  {!n.read && (
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                  )}
                  <div className={cn('flex-1 min-w-0', n.read && 'ms-5.5')}>
                    <p className={cn('text-sm', !n.read ? 'font-semibold' : 'font-medium')}>{title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{body}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{timeAgo}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {hasMore && !loading && notifications.length > 0 && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={() => fetchNotifications(notifications.length, filter)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 bg-card border rounded-xl text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {isAr ? 'تحميل المزيد' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
