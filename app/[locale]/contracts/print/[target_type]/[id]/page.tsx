import { pick } from '@/lib/i18n-helpers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { headers as nextHeaders } from 'next/headers'
import { PrintButton } from '@/components/contracts/print-button'
import { logContractEvent } from '@/lib/contract-events'
import {
  CLIENT_CONTRACT_AR, CLIENT_CONTRACT_EN, CLIENT_CONTRACT_META,
  MARKETEER_CONTRACT_AR, MARKETEER_CONTRACT_EN, MARKETEER_CONTRACT_META,
  SERVICE_PROVIDER_CONTRACT_AR, SERVICE_PROVIDER_CONTRACT_EN, SERVICE_PROVIDER_CONTRACT_META,
} from '@/lib/contracts'

type RouteParams = { params: Promise<{ target_type: string; id: string }> }

const BOOKING_TABLES: Record<string, { table: string; role: 'client'; titleBuilder: (d: { id: string; passenger_name?: string; guest_name?: string; kind_ar: string; kind_en: string }) => { ar: string; en: string } }> = {
  booking: {
    table: 'bookings', role: 'client',
    titleBuilder: (d) => ({ ar: `عقد حجز رحلة — ${d.passenger_name || ''} — #${d.id.slice(0, 8).toUpperCase()}`,
                           en: `Flight booking contract — ${d.passenger_name || ''} — #${d.id.slice(0, 8).toUpperCase()}` }),
  },
  room_booking: {
    table: 'room_bookings', role: 'client',
    titleBuilder: (d) => ({ ar: `عقد حجز غرفة — ${d.guest_name || ''} — #${d.id.slice(0, 8).toUpperCase()}`,
                           en: `Room booking contract — ${d.guest_name || ''} — #${d.id.slice(0, 8).toUpperCase()}` }),
  },
  car_booking: {
    table: 'car_bookings', role: 'client',
    titleBuilder: (d) => ({ ar: `عقد حجز سيارة — ${d.guest_name || ''} — #${d.id.slice(0, 8).toUpperCase()}`,
                           en: `Car booking contract — ${d.guest_name || ''} — #${d.id.slice(0, 8).toUpperCase()}` }),
  },
  package_booking: {
    table: 'package_bookings', role: 'client',
    titleBuilder: (d) => ({ ar: `عقد حجز باقة — ${d.guest_name || ''} — #${d.id.slice(0, 8).toUpperCase()}`,
                           en: `Package booking contract — ${d.guest_name || ''} — #${d.id.slice(0, 8).toUpperCase()}` }),
  },
}

type Row = {
  id: string
  buyer_signature_url?: string | null
  signature_url?: string | null
  contract_signed_at?: string | null
  contract_version?: string | null
  passenger_name?: string
  guest_name?: string
  user_id?: string
  full_name?: string
  company_name_ar?: string
  company_name_en?: string | null
}

export default async function PrintContractPage({ params }: RouteParams) {
  const { target_type, id } = await params
  const locale = await getLocale()
  const isAr = locale === 'ar'

  // Auth: buyer owner, provider owner, marketeer, or admin can print
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login?redirect=/${locale}/contracts/print/${target_type}/${id}`)
  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let sigUrl: string | null = null
  let signedAt: string | null = null
  let contractVersion: string | null = null
  let contractBody: { ar: string; en: string; title_ar: string; title_en: string; version: string } | null = null
  let contextTitle = { ar: 'عقد', en: 'Contract' }

  if (target_type in BOOKING_TABLES) {
    const { table, titleBuilder } = BOOKING_TABLES[target_type]
    const { data } = await supabaseAdmin
      .from(table)
      .select('id, buyer_id, provider_id, buyer_signature_url, contract_signed_at, contract_version, passenger_name, guest_name')
      .eq('id', id)
      .single<Row & { buyer_id: string | null; provider_id: string | null }>()
    if (!data) notFound()
    const isOwner = data.buyer_id && data.buyer_id === user.id
    // Providers can print contracts for their own bookings
    let isProvider = false
    if (!isOwner && !isAdmin && data.provider_id) {
      const { data: p } = await supabaseAdmin.from('providers').select('id').eq('id', data.provider_id).eq('user_id', user.id).maybeSingle()
      isProvider = !!p
    }
    if (!isOwner && !isAdmin && !isProvider) redirect(`/${locale}`)
    sigUrl = data.buyer_signature_url || null
    signedAt = data.contract_signed_at || null
    contractVersion = data.contract_version || null
    contractBody = {
      ar: CLIENT_CONTRACT_AR, en: CLIENT_CONTRACT_EN,
      title_ar: CLIENT_CONTRACT_META.title_ar, title_en: CLIENT_CONTRACT_META.title_en,
      version: CLIENT_CONTRACT_META.version,
    }
    const kind = target_type === 'room_booking' ? { ar: 'غرفة', en: 'room' }
      : target_type === 'car_booking' ? { ar: 'سيارة', en: 'car' }
      : target_type === 'package_booking' ? { ar: 'باقة', en: 'package' }
      : { ar: 'رحلة', en: 'flight' }
    contextTitle = titleBuilder({ id, passenger_name: data.passenger_name, guest_name: data.guest_name, kind_ar: kind.ar, kind_en: kind.en })
  } else if (target_type === 'provider_application') {
    const { data } = await supabaseAdmin
      .from('provider_applications')
      .select('id, user_id, signature_url, contract_signed_at, contract_version, company_name_ar, company_name_en')
      .eq('id', id)
      .single<Row>()
    if (!data) notFound()
    if (data.user_id !== user.id && !isAdmin) redirect(`/${locale}`)
    sigUrl = data.signature_url || null
    signedAt = data.contract_signed_at || null
    contractVersion = data.contract_version || null
    contractBody = {
      ar: SERVICE_PROVIDER_CONTRACT_AR, en: SERVICE_PROVIDER_CONTRACT_EN,
      title_ar: SERVICE_PROVIDER_CONTRACT_META.title_ar, title_en: SERVICE_PROVIDER_CONTRACT_META.title_en,
      version: SERVICE_PROVIDER_CONTRACT_META.version,
    }
    contextTitle = {
      ar: `${SERVICE_PROVIDER_CONTRACT_META.title_ar} — ${data.company_name_ar || ''}`,
      en: `${SERVICE_PROVIDER_CONTRACT_META.title_en} — ${data.company_name_en || data.company_name_ar || ''}`,
    }
  } else if (target_type === 'marketeer_application') {
    const { data } = await supabaseAdmin
      .from('marketeer_applications')
      .select('id, user_id, signature_url, contract_signed_at, contract_version, full_name')
      .eq('id', id)
      .single<Row>()
    if (!data) notFound()
    if (data.user_id !== user.id && !isAdmin) redirect(`/${locale}`)
    sigUrl = data.signature_url || null
    signedAt = data.contract_signed_at || null
    contractVersion = data.contract_version || null
    contractBody = {
      ar: MARKETEER_CONTRACT_AR, en: MARKETEER_CONTRACT_EN,
      title_ar: MARKETEER_CONTRACT_META.title_ar, title_en: MARKETEER_CONTRACT_META.title_en,
      version: MARKETEER_CONTRACT_META.version,
    }
    contextTitle = {
      ar: `${MARKETEER_CONTRACT_META.title_ar} — ${data.full_name || ''}`,
      en: `${MARKETEER_CONTRACT_META.title_en} — ${data.full_name || ''}`,
    }
  } else {
    notFound()
  }

  if (!contractBody) notFound()

  // Audit log: record that this contract was viewed (non-fatal).
  const hdrs = await nextHeaders()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || null
  const userAgent = hdrs.get('user-agent') || null
  const viewerRole = isAdmin ? 'admin' : (profile?.role ?? null)
  await logContractEvent({
    event_type: 'viewed',
    target_type: target_type as 'booking' | 'room_booking' | 'car_booking' | 'package_booking' | 'provider_application' | 'marketeer_application',
    target_id: id,
    actor_id: user.id,
    actor_role: viewerRole,
    ip_raw: ip,
    user_agent: userAgent,
  })

  return (
    <div dir={pick(locale, 'rtl', 'ltr', 'ltr')} className="min-h-screen bg-slate-100 py-10">
      <style>{`
        @media print {
          @page { size: A4; margin: 18mm; }
          .no-print { display: none !important; }
          body, .print-sheet { background: white !important; box-shadow: none !important; }
          .print-sheet { max-width: none !important; padding: 0 !important; }
          .page-break { page-break-before: always; }
        }
      `}</style>

      <div className="mx-auto max-w-3xl">
        <div className="no-print mb-5 flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow">
          <div>
            <h1 className="text-lg font-bold">{isAr ? contextTitle.ar : contextTitle.en}</h1>
            <p className="text-xs text-muted-foreground">
              {pick(locale, 'اطبع هذه الصفحة أو احفظها كملف PDF.', 'Print this page or save as PDF.', 'Bu sayfayı yazdırın veya PDF olarak kaydedin.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/${pick(locale, 'en', 'ar', 'tr')}/contracts/print/${target_type}/${id}`}
              className="rounded-lg border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {pick(locale, 'EN', 'AR', 'AR')}
            </a>
            <PrintButton label={pick(locale, 'طباعة / حفظ PDF', 'Print / Save as PDF', 'Yazdır / PDF Olarak Kaydet')} />
          </div>
        </div>

        <div className="print-sheet mx-auto rounded-2xl bg-white p-10 shadow-lg">
          <header className="mb-6 border-b pb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">BookitFly</p>
            <h1 className="mt-1 text-2xl font-black">
              {isAr ? contractBody.title_ar : contractBody.title_en}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {pick(locale, 'الإصدار', 'Version', 'Sürüm')} {contractBody.version}
              {signedAt ? (pick(locale, ` · تم التوقيع ${new Date(signedAt).toLocaleString('ar-SA')}`, ` · Signed ${new Date(signedAt).toLocaleString('en-US')}`)) : ''}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pick(locale, 'رقم المرجع', 'Reference', 'Referans')}: <span className="font-mono">{id}</span>
            </p>
          </header>

          <article>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{isAr ? contractBody.ar : contractBody.en}</pre>
          </article>

          <section className="mt-10 grid grid-cols-2 gap-8 border-t pt-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {pick(locale, 'توقيع الطرف الأول', 'First Party Signature', 'Birinci Taraf İmzası')}
              </p>
              <div className="border-b border-slate-300 pb-1 h-20 flex items-end text-xs text-slate-400">
                {pick(locale, 'Booktfly للسياحة والسفر', 'Booktfly Tourism & Travel', 'Booktfly Turizm ve Seyahat')}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {pick(locale, 'توقيع الطرف الثاني', 'Second Party Signature', 'İkinci Taraf İmzası')}
              </p>
              {sigUrl && signedAt ? (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sigUrl} alt="Signature" className="max-h-20 object-contain" />
                  <div className="mt-1 border-t pt-1 text-xs text-muted-foreground">
                    {new Date(signedAt).toLocaleString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                    {contractVersion ? ` · ${contractVersion}` : ''}
                  </div>
                </div>
              ) : (
                <div className="border-b border-slate-300 pb-1 h-20 flex items-end text-xs text-slate-400">
                  {pick(locale, '(لم يُوقَّع بعد)', '(not yet signed)', '(henüz imzalanmadı)')}
                </div>
              )}
            </div>
          </section>

          <footer className="mt-10 pt-4 border-t text-center text-[10px] text-slate-400">
            {pick(locale, 'هذا العقد ملزم قانونياً وفق أنظمة المملكة العربية السعودية.', 'This contract is legally binding under Saudi Arabian law.', 'Bu sözleşme Suudi Arabistan yasaları kapsamında yasal olarak bağlayıcıdır.')}
          </footer>
        </div>
      </div>
    </div>
  )
}

