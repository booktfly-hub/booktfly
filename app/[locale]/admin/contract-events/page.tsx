import { pick } from '@/lib/i18n-helpers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import Link from 'next/link'
import { FileSignature, Eye, Printer, Bell, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

type EventRow = {
  id: string
  event_type: 'signed' | 'viewed' | 'reprinted' | 'reminder_sent'
  target_type: string
  target_id: string
  actor_id: string | null
  actor_role: string | null
  ip_hash: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  created_at: string
}

function labelForType(t: string, isAr: boolean) {
  const map: Record<string, { ar: string; en: string }> = {
    booking: { ar: 'حجز رحلة', en: 'Flight booking' },
    room_booking: { ar: 'حجز غرفة', en: 'Room booking' },
    car_booking: { ar: 'حجز سيارة', en: 'Car booking' },
    package_booking: { ar: 'حجز باقة', en: 'Package booking' },
    provider_application: { ar: 'طلب مزود خدمة', en: 'Provider app' },
    marketeer_application: { ar: 'طلب مسوِّق', en: 'Marketer app' },
  }
  const entry = map[t] || { ar: t, en: t }
  return isAr ? entry.ar : entry.en
}

function eventIcon(type: string) {
  switch (type) {
    case 'signed': return FileSignature
    case 'viewed': return Eye
    case 'reprinted': return Printer
    case 'reminder_sent': return Bell
    default: return User
  }
}

function eventTone(type: string) {
  switch (type) {
    case 'signed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'viewed': return 'bg-sky-50 text-sky-700 border-sky-100'
    case 'reprinted': return 'bg-violet-50 text-violet-700 border-violet-100'
    case 'reminder_sent': return 'bg-amber-50 text-amber-700 border-amber-100'
    default: return 'bg-slate-50 text-slate-600 border-slate-200'
  }
}

export default async function AdminContractEventsPage() {
  const locale = await getLocale()
  const isAr = locale === 'ar'

  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect(`/${locale}`)

  const { data: events } = await supabaseAdmin
    .from('contract_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  const rows = (events as EventRow[] | null) ?? []

  const actorIds = Array.from(new Set(rows.map(r => r.actor_id).filter(Boolean))) as string[]
  const { data: profiles } = actorIds.length > 0
    ? await supabaseAdmin.from('profiles').select('id, full_name, email').in('id', actorIds)
    : { data: [] as { id: string; full_name: string | null; email: string }[] }
  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{pick(locale, 'سجل أحداث العقود', 'Contract Audit Log', 'Sözleşme Denetim Kaydı')}</h1>
        <p className="text-sm text-muted-foreground">
          {pick(locale, 'سجل دقيق لكل حدث على العقود: التوقيع، العرض، الطباعة، التذكيرات. يُخزَّن معرف IP كمُهشَّم فقط.', 'Detailed log of every contract event: signing, viewing, printing, reminders. IPs are hashed, not stored raw.', 'Her sözleşme olayının ayrıntılı kaydı: imzalama, görüntüleme, yazdırma, hatırlatmalar. IP\'ler hashlenir, ham olarak saklanmaz.')}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-start p-3 font-medium">{pick(locale, 'الحدث', 'Event', 'Olay')}</th>
              <th className="text-start p-3 font-medium">{pick(locale, 'النوع', 'Target', 'Hedef')}</th>
              <th className="text-start p-3 font-medium">{pick(locale, 'المُعرِّف', 'Target ID', 'Hedef Kimliği')}</th>
              <th className="text-start p-3 font-medium">{pick(locale, 'المستخدم', 'Actor', 'Aktör')}</th>
              <th className="text-start p-3 font-medium">{pick(locale, 'التاريخ', 'When', 'Ne Zaman')}</th>
              <th className="text-start p-3 font-medium">{pick(locale, 'التفاصيل', 'Details', 'Ayrıntılar')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{pick(locale, 'لا توجد أحداث بعد', 'No events yet', 'Henüz olay yok')}</td></tr>
            ) : (
              rows.map(ev => {
                const Icon = eventIcon(ev.event_type)
                const actor = ev.actor_id ? profileMap.get(ev.actor_id) : null
                return (
                  <tr key={ev.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-bold ${eventTone(ev.event_type)}`}>
                        <Icon className="h-3 w-3" />
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {labelForType(ev.target_type, isAr)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/contracts/print/${ev.target_type}/${ev.target_id}`}
                        target="_blank"
                        className="font-mono text-[11px] text-primary hover:underline"
                      >
                        {ev.target_id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="p-3 text-xs">
                      {actor ? (
                        <div>
                          <div className="font-semibold">{actor.full_name || '—'}</div>
                          <div className="text-muted-foreground">{actor.email}</div>
                        </div>
                      ) : (
                        <span className="italic text-muted-foreground">
                          {ev.actor_role === 'guest' ? (pick(locale, 'ضيف', 'Guest', 'Misafir')) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(ev.created_at).toLocaleString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'), { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 text-xs">
                      {ev.ip_hash && (
                        <div className="font-mono text-[10px] text-muted-foreground" title={ev.user_agent || ''}>
                          IP: {ev.ip_hash.slice(0, 8)}…
                        </div>
                      )}
                      {Object.keys(ev.metadata).length > 0 && (
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {Object.entries(ev.metadata).map(([k, v]) => `${k}=${String(v)}`).join(', ')}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
