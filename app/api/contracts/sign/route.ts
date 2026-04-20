import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { notify, notifyAdmin } from '@/lib/notifications'
import { shortId } from '@/lib/utils'
import { logContractEvent, extractClientMeta } from '@/lib/contract-events'
import { archiveSignedContract } from '@/lib/contract-archive'
import { z } from 'zod'
import type { ContractRole } from '@/lib/contracts/version'

const schema = z.object({
  role: z.enum(['client', 'marketeer', 'service_provider']),
  target_type: z.enum([
    'booking',
    'room_booking',
    'car_booking',
    'package_booking',
    'provider_application',
    'marketeer_application',
  ]),
  target_id: z.string().uuid(),
  signature_data_url: z.string().regex(/^data:image\/png;base64,/, 'Must be PNG data URL'),
  contract_version: z.string().default('v1-2024'),
  guest_token: z.string().uuid().optional(),
})

const BOOKING_TABLES: Record<string, { table: string; providerSelect: string }> = {
  booking: { table: 'bookings', providerSelect: 'provider:providers(user_id)' },
  room_booking: { table: 'room_bookings', providerSelect: 'provider:providers(user_id)' },
  car_booking: { table: 'car_bookings', providerSelect: 'provider:providers(user_id)' },
  package_booking: { table: 'package_bookings', providerSelect: 'provider:providers(user_id)' },
}

function dataUrlToBuffer(dataUrl: string) {
  const b64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(b64, 'base64')
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 8, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const { role, target_type, target_id, signature_data_url, contract_version, guest_token } = parsed.data

    // Payload size guard: decoded PNG should be < 300 KB
    const buffer = dataUrlToBuffer(signature_data_url)
    if (buffer.byteLength > 300 * 1024) {
      return NextResponse.json({ error: 'Signature too large' }, { status: 413 })
    }

    // Authorize: map (role, target_type) to required identity
    let folderOwner: string // storage folder prefix
    if (target_type in BOOKING_TABLES) {
      // Buyer (or guest via guest_token) signs the client contract
      const { table } = BOOKING_TABLES[target_type]
      const { data: booking } = await supabaseAdmin
        .from(table)
        .select('id, buyer_id, guest_token')
        .eq('id', target_id)
        .single()
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

      const isOwner = user?.id && booking.buyer_id === user.id
      const isGuest = !user && guest_token && booking.guest_token === guest_token
      if (!isOwner && !isGuest) {
        return NextResponse.json({ error: 'Not authorized for this booking' }, { status: 403 })
      }
      folderOwner = user?.id || `guest/${guest_token}`
      if (role !== 'client') return NextResponse.json({ error: 'Role mismatch' }, { status: 400 })
    } else if (target_type === 'provider_application') {
      if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      const { data: app } = await supabaseAdmin
        .from('provider_applications')
        .select('id, user_id')
        .eq('id', target_id)
        .single()
      if (!app || app.user_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      folderOwner = user.id
      if (role !== 'service_provider') return NextResponse.json({ error: 'Role mismatch' }, { status: 400 })
    } else {
      if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      const { data: app } = await supabaseAdmin
        .from('marketeer_applications')
        .select('id, user_id')
        .eq('id', target_id)
        .single()
      if (!app || app.user_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
      folderOwner = user.id
      if (role !== 'marketeer') return NextResponse.json({ error: 'Role mismatch' }, { status: 400 })
    }

    // Upload to signatures/{folderOwner}/{role}-{target_id}-{ts}.png
    const path = `${folderOwner}/${role}-${target_id}-${Date.now()}.png`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('signatures')
      .upload(path, buffer, { contentType: 'image/png', upsert: false })
    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
    }

    // Build signed url (private bucket). 10 years.
    const { data: signed } = await supabaseAdmin.storage
      .from('signatures')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
    const signature_url = signed?.signedUrl || path
    const signedAt = new Date().toISOString()

    // Update target row
    let updateError: string | null = null
    if (target_type in BOOKING_TABLES) {
      const { table } = BOOKING_TABLES[target_type]
      const { error } = await supabaseAdmin
        .from(table)
        .update({ buyer_signature_url: signature_url, contract_signed_at: signedAt, contract_version })
        .eq('id', target_id)
      updateError = error?.message || null
    } else if (target_type === 'provider_application') {
      const { error } = await supabaseAdmin
        .from('provider_applications')
        .update({ signature_url, contract_signed_at: signedAt, contract_version })
        .eq('id', target_id)
      updateError = error?.message || null
    } else {
      const { error } = await supabaseAdmin
        .from('marketeer_applications')
        .update({ signature_url, contract_signed_at: signedAt, contract_version })
        .eq('id', target_id)
      updateError = error?.message || null
    }

    if (updateError) {
      return NextResponse.json({ error: 'Failed to record signature: ' + updateError }, { status: 500 })
    }

    // Archive the signed contract as an immutable HTML snapshot in signed-contracts bucket
    const ownerPathSegment = user?.id || `guest/${guest_token}`
    const archiveUrl = await archiveSignedContract(
      {
        target_type,
        target_id,
        signature_url,
        contract_version,
        signed_at: signedAt,
      },
      ownerPathSegment
    )
    if (archiveUrl) {
      const archiveTable = target_type in BOOKING_TABLES
        ? BOOKING_TABLES[target_type].table
        : target_type === 'provider_application'
          ? 'provider_applications'
          : 'marketeer_applications'
      await supabaseAdmin.from(archiveTable).update({ contract_archive_url: archiveUrl }).eq('id', target_id)
    }

    // Also save to profile.signature_url for logged-in users so they can reuse it later
    if (user?.id) {
      await supabaseAdmin
        .from('profiles')
        .update({ signature_url })
        .eq('id', user.id)
    }

    // Notifications: buyer -> provider, provider/marketeer -> admin
    try {
      if (target_type in BOOKING_TABLES) {
        // Notify the service provider of the signed client contract
        const { table } = BOOKING_TABLES[target_type]
        const { data: bk } = await supabaseAdmin
          .from(table)
          .select('id, buyer_id, passenger_name, guest_name, passenger_email, guest_email, provider:providers(user_id)')
          .eq('id', target_id)
          .single()
        const bookingRef = bk ? shortId(bk.id) : target_id.slice(0, 6)
        type ProvRef = { user_id?: string | null }
        type BkRow = {
          buyer_id?: string | null
          passenger_name?: string | null
          guest_name?: string | null
          passenger_email?: string | null
          guest_email?: string | null
          provider?: ProvRef | ProvRef[] | null
        }
        const bkAny = bk as unknown as BkRow | null
        const providerObj = Array.isArray(bkAny?.provider) ? bkAny?.provider[0] : bkAny?.provider
        const providerUserId = providerObj?.user_id
        const kindLabel = target_type === 'room_booking' ? { ar: 'غرفة', en: 'room' }
          : target_type === 'car_booking' ? { ar: 'سيارة', en: 'car' }
          : target_type === 'package_booking' ? { ar: 'باقة', en: 'package' }
          : { ar: 'رحلة', en: 'flight' }
        const pdfRelPath = `/contracts/print/${target_type}/${target_id}`
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const pdfUrl = `${appUrl}${pdfRelPath}`
        const buyerName = bkAny?.passenger_name || bkAny?.guest_name || ''
        const emailHtml = `
          <p>Thanks for signing the client service contract with BookitFly.</p>
          <p><b>Booking:</b> ${kindLabel.en} #${bookingRef}</p>
          <p><b>Passenger:</b> ${buyerName}</p>
          <p>You can view or print a copy of the signed contract at any time:</p>
          <p><a href="${pdfUrl}">View / print signed contract</a></p>
        `
        const emailHtmlAr = `
          <p>شكراً لك على توقيع عقد الخدمة مع BookitFly.</p>
          <p><b>الحجز:</b> ${kindLabel.ar} #${bookingRef}</p>
          <p><b>المسافر:</b> ${buyerName}</p>
          <p>يمكنك عرض نسخة من العقد الموقّع أو طباعتها في أي وقت:</p>
          <p><a href="${pdfUrl}">عرض / طباعة العقد الموقّع</a></p>
        `
        if (providerUserId) {
          await notify({
            userId: providerUserId,
            type: 'contract_signed',
            titleAr: 'تم توقيع عقد العميل',
            titleEn: 'Client contract signed',
            bodyAr: `وقّع العميل على عقد الخدمة لحجز ${kindLabel.ar} #${bookingRef}.`,
            bodyEn: `Client signed the service contract for ${kindLabel.en} booking #${bookingRef}.`,
            data: { booking_id: target_id, booking_kind: target_type },
          })
        }
        // Notify the BUYER with confirmation + link to print the signed contract
        if (bkAny?.buyer_id) {
          await notify({
            userId: bkAny.buyer_id,
            type: 'contract_signed',
            titleAr: 'تم استلام توقيعك',
            titleEn: 'Your signature was received',
            bodyAr: `تم استلام توقيعك على عقد ${kindLabel.ar} #${bookingRef}. يمكنك طباعة العقد الموقّع من حسابك.`,
            bodyEn: `Your signature on ${kindLabel.en} booking #${bookingRef} was received. You can print the signed contract from your account.`,
            data: { booking_id: target_id, booking_kind: target_type, pdf_url: pdfUrl },
            email: {
              subject: `Your signed ${kindLabel.en} booking contract — #${bookingRef}`,
              html: emailHtml,
            },
          })
        } else if (bkAny?.passenger_email || bkAny?.guest_email) {
          // Guest: send direct email via Resend (notify() requires profile lookup)
          const guestEmail = bkAny.passenger_email || bkAny.guest_email
          try {
            const { Resend } = await import('resend')
            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
              from: 'BookitFly <noreply@booktfly.com>',
              to: guestEmail!,
              subject: `Your signed ${kindLabel.en} booking contract — #${bookingRef}`,
              html: emailHtml + '<hr/>' + emailHtmlAr,
            })
          } catch (e) {
            console.error('guest sign email error:', e)
          }
        }
      } else if (target_type === 'provider_application') {
        await notifyAdmin({
          type: 'contract_signed',
          titleAr: 'توقيع عقد مزود خدمة',
          titleEn: 'Provider contract signed',
          bodyAr: `وقّع مزود خدمة على عقد تقديم الخدمات (الطلب #${target_id.slice(0, 6)}).`,
          bodyEn: `A provider signed the Service Provider Agreement (application #${target_id.slice(0, 6)}).`,
          data: { application_id: target_id },
        })
        if (user?.id) {
          await notify({
            userId: user.id,
            type: 'contract_signed',
            titleAr: 'تم استلام توقيعك',
            titleEn: 'Your signature was received',
            bodyAr: 'تم حفظ توقيعك على عقد مزود الخدمة بنجاح.',
            bodyEn: 'Your signature on the Service Provider Agreement was saved successfully.',
          })
        }
      } else if (target_type === 'marketeer_application') {
        await notifyAdmin({
          type: 'contract_signed',
          titleAr: 'توقيع عقد مسوِّق',
          titleEn: 'Marketer contract signed',
          bodyAr: `وقّع مسوِّق على عقد الشراكة التسويقية (الطلب #${target_id.slice(0, 6)}).`,
          bodyEn: `A marketer signed the Marketing Partnership Agreement (application #${target_id.slice(0, 6)}).`,
          data: { application_id: target_id },
        })
        if (user?.id) {
          await notify({
            userId: user.id,
            type: 'contract_signed',
            titleAr: 'تم استلام توقيعك',
            titleEn: 'Your signature was received',
            bodyAr: 'تم حفظ توقيعك على عقد الشراكة التسويقية بنجاح.',
            bodyEn: 'Your signature on the Marketing Partnership Agreement was saved successfully.',
          })
        }
      }
    } catch (notifyErr) {
      // Non-fatal
      console.error('contract sign notify error:', notifyErr)
    }

    // Audit-log the sign event (non-fatal)
    const { ip, userAgent } = extractClientMeta(request)
    await logContractEvent({
      event_type: 'signed',
      target_type,
      target_id,
      actor_id: user?.id ?? null,
      actor_role: user ? null : 'guest',
      ip_raw: ip,
      user_agent: userAgent,
      metadata: { role, contract_version, is_guest: !user },
    })

    return NextResponse.json({ ok: true, signature_url, contract_signed_at: signedAt, contract_version })
  } catch (err) {
    console.error('contracts/sign error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
