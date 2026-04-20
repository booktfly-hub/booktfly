import { supabaseAdmin } from '@/lib/supabase/admin'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Globe, TrendingUp, MousePointerClick } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Row = { country: string | null; session_id: string; path: string; created_at: string }

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function topN<T>(items: T[], key: (x: T) => string, limit = 10) {
  const counts = new Map<string, number>()
  for (const it of items) {
    const k = key(it) || '—'
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}

export default async function AdminVisitorsPage() {
  const locale = await getLocale()
  const isAr = locale === 'ar'

  // Gate: only admins
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${locale}`)

  const [today, d7, d30] = await Promise.all([
    supabaseAdmin.from('site_visits').select('id, session_id, country, path, created_at').gte('created_at', daysAgo(0)),
    supabaseAdmin.from('site_visits').select('id, session_id, country, path, created_at').gte('created_at', daysAgo(7)),
    supabaseAdmin.from('site_visits').select('id, session_id, country, path, created_at').gte('created_at', daysAgo(30)),
  ])

  const rows30 = (d30.data as Row[] | null) ?? []
  const rows7 = (d7.data as Row[] | null) ?? []
  const rowsToday = (today.data as Row[] | null) ?? []

  const uniqueSessions30 = new Set(rows30.map((r) => r.session_id)).size
  const topCountries = topN(rows30, (r) => r.country ?? '—', 10)
  const topPaths = topN(rows30, (r) => r.path, 10)

  const maxCountry = topCountries[0]?.[1] ?? 1
  const maxPath = topPaths[0]?.[1] ?? 1

  const Card = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Users }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  )

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{isAr ? 'تحليلات الزوار' : 'Visitor Analytics'}</h1>
        <p className="text-sm text-muted-foreground">
          {isAr ? 'عرض مبني على رؤوس Vercel Geo، بدون تخزين IP الأصلي.' : 'Powered by Vercel geo headers. Raw IPs are never stored.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label={isAr ? 'زيارات اليوم' : 'Today'} value={rowsToday.length} icon={TrendingUp} />
        <Card label={isAr ? 'آخر 7 أيام' : 'Last 7 days'} value={rows7.length} icon={TrendingUp} />
        <Card label={isAr ? 'آخر 30 يوماً' : 'Last 30 days'} value={rows30.length} icon={MousePointerClick} />
        <Card label={isAr ? 'زوار فريدون (30 يوماً)' : 'Unique visitors (30d)'} value={uniqueSessions30} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="font-bold">{isAr ? 'أفضل الدول (آخر 30 يوماً)' : 'Top countries (last 30 days)'}</h2>
          </div>
          {topCountries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
          ) : (
            <ul className="space-y-3">
              {topCountries.map(([country, count]) => (
                <li key={country} className="text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-bold">{country}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(count / maxCountry) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-primary" />
            <h2 className="font-bold">{isAr ? 'أكثر الصفحات زيارة' : 'Top pages'}</h2>
          </div>
          {topPaths.length === 0 ? (
            <p className="text-sm text-muted-foreground">{isAr ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
          ) : (
            <ul className="space-y-3">
              {topPaths.map(([path, count]) => (
                <li key={path} className="text-sm">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs truncate">{path}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(count / maxPath) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
