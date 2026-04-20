import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { shortId } from '@/lib/utils'

// Only the configured CRON_SECRET can trigger reminders.
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get('authorization') || ''
  const expected = `Bearer ${secret}`
  return header === expected
}

type UnsignedBooking = {
  id: string
  buyer_id: string | null
  guest_token: string | null
  passenger_name?: string
  passenger_email?: string
  guest_name?: string
  guest_email?: string
  contract_signed_at: string | null
  created_at: string
}

const KIND_CONFIG = {
  booking: { table: 'bookings', labelAr: 'رحلة', labelEn: 'flight', targetType: 'booking' as const },
  room_booking: { table: 'room_bookings', labelAr: 'غرفة', labelEn: 'room', targetType: 'room_booking' as const },
  car_booking: { table: 'car_bookings', labelAr: 'سيارة', labelEn: 'car', targetType: 'car_booking' as const },
  package_booking: { table: 'package_bookings', labelAr: 'باقة', labelEn: 'package', targetType: 'package_booking' as const },
}

async function processKind(
  kind: keyof typeof KIND_CONFIG,
  resend: Resend | null,
  appUrl: string
): Promise<{ kind: string; eligible: number; sent: number; errors: number }> {
  const cfg = KIND_CONFIG[kind]
  // Older than 24h, unsigned, not reminded in last 24h, still pending payment
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const selectCols = kind === 'booking'
    ? 'id, buyer_id, guest_token, passenger_name, passenger_email, contract_signed_at, created_at, contract_reminder_sent_at'
    : 'id, buyer_id, guest_token, guest_name, guest_email, contract_signed_at, created_at, contract_reminder_sent_at'

  const { data, error } = await supabaseAdmin
    .from(cfg.table)
    .select(selectCols)
    .is('contract_signed_at', null)
    .eq('status', 'payment_processing')
    .lte('created_at', twentyFourHoursAgo)
    .or(`contract_reminder_sent_at.is.null,contract_reminder_sent_at.lte.${twentyFourHoursAgo}`)
    .limit(200)

  if (error) return { kind: cfg.table, eligible: 0, sent: 0, errors: 1 }
  const rows = (data ?? []) as unknown as UnsignedBooking[]

  let sent = 0
  let errors = 0

  for (const row of rows) {
    // Resolve recipient email
    let recipientEmail: string | null = null
    if (row.buyer_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', row.buyer_id)
        .single()
      recipientEmail = profile?.email ?? null
    }
    if (!recipientEmail) {
      recipientEmail = row.passenger_email || row.guest_email || null
    }
    if (!recipientEmail) continue

    const ref = shortId(row.id)
    const name = row.passenger_name || row.guest_name || ''
    const signUrl = `${appUrl}/${row.buyer_id ? 'en/my-bookings' : 'en/guest/booking/' + (row.guest_token || '')}`
    const html = `
      <p>Hello ${name || 'there'},</p>
      <p>Your ${cfg.labelEn} booking <b>#${ref}</b> is awaiting your signed contract before we can process payment.</p>
      <p>Please review and sign the contract here:</p>
      <p><a href="${signUrl}">Review and sign — ${ref}</a></p>
      <hr/>
      <p>مرحباً ${name || ''}،</p>
      <p>حجز ${cfg.labelAr} رقم <b>#${ref}</b> بانتظار توقيعك على العقد لإتمام عملية الدفع.</p>
      <p><a href="${signUrl}">مراجعة العقد والتوقيع</a></p>
    `

    try {
      if (resend) {
        await resend.emails.send({
          from: 'BookitFly <noreply@booktfly.com>',
          to: recipientEmail,
          subject: `Action required: sign your ${cfg.labelEn} booking contract (#${ref})`,
          html,
        })
      }
      // In-app notification for logged-in buyers
      if (row.buyer_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: row.buyer_id,
          type: 'contract_signed',
          title_ar: 'تذكير: توقيع العقد مطلوب',
          title_en: 'Reminder: sign your contract',
          body_ar: `حجز ${cfg.labelAr} #${ref} بانتظار توقيعك.`,
          body_en: `Your ${cfg.labelEn} booking #${ref} is awaiting your signature.`,
          data: { booking_id: row.id, booking_kind: cfg.targetType },
        })
      }
      // Mark reminded
      await supabaseAdmin
        .from(cfg.table)
        .update({ contract_reminder_sent_at: new Date().toISOString() })
        .eq('id', row.id)
      sent++
    } catch (e) {
      console.error(`reminder ${cfg.table} ${row.id} failed:`, e)
      errors++
    }
  }

  return { kind: cfg.table, eligible: rows.length, sent, errors }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const apiKey = process.env.RESEND_API_KEY
  const resend = apiKey && !apiKey.includes('placeholder') ? new Resend(apiKey) : null

  const results = []
  for (const kind of Object.keys(KIND_CONFIG) as (keyof typeof KIND_CONFIG)[]) {
    results.push(await processKind(kind, resend, appUrl))
  }

  const summary = {
    ok: true,
    ran_at: new Date().toISOString(),
    resend_configured: !!resend,
    results,
  }
  return NextResponse.json(summary)
}

// Helpful for manual verification from a browser while logged in as admin
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized — use Authorization: Bearer <CRON_SECRET>' }, { status: 401 })
  }
  return NextResponse.json({ ok: true, hint: 'POST with same auth header to actually run reminders.' })
}
