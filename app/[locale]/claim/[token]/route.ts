import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/activity-log'

type RouteParams = { params: Promise<{ locale: string; token: string }> }

const FAILURE_REDIRECT = (origin: string, locale: string) =>
  `${origin}/${locale}/auth/login?error=claim_invalid`

export async function GET(request: Request, { params }: RouteParams) {
  const { locale, token } = await params
  const { origin } = new URL(request.url)

  if (!token) {
    return NextResponse.redirect(FAILURE_REDIRECT(origin, locale))
  }

  const booking = await findBookingByToken(token)
  if (!booking?.email) {
    return NextResponse.redirect(FAILURE_REDIRECT(origin, locale))
  }

  const email = booking.email.toLowerCase()
  const fullName = booking.name?.trim() || email.split('@')[0]

  // Find or create auth user
  let userId = await findUserIdByEmail(email)
  const isNewUser = !userId

  if (!userId) {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: fullName, claimed_from: 'guest_booking' },
    })
    if (createErr || !created?.user) {
      console.error('[claim] createUser failed', createErr)
      return NextResponse.redirect(FAILURE_REDIRECT(origin, locale))
    }
    userId = created.user.id

    // Ensure a profile row exists
    await supabaseAdmin.from('profiles').upsert(
      { id: userId, full_name: fullName, locale },
      { onConflict: 'id' }
    )
  }

  // Merge all guest bookings for this email into the user
  await mergeGuestBookings(email, userId!)
  logActivity(isNewUser ? 'guest_claim_new' : 'guest_claim_existing', {
    userId: userId!,
    metadata: { email },
  })

  // Generate a magic link the browser will follow to get an authenticated session
  const redirectTo = `${origin}/${locale}/auth/callback?next=/${locale}/my-bookings`
  const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (linkErr || !link?.properties?.action_link) {
    console.error('[claim] generateLink failed', linkErr)
    return NextResponse.redirect(FAILURE_REDIRECT(origin, locale))
  }

  return NextResponse.redirect(link.properties.action_link)
}

async function findBookingByToken(token: string): Promise<{ email: string; name: string } | null> {
  const lookups: Array<{ table: 'bookings' | 'room_bookings' | 'car_bookings' | 'package_bookings'; emailCol: string; nameCol: string }> = [
    { table: 'bookings', emailCol: 'passenger_email', nameCol: 'passenger_name' },
    { table: 'room_bookings', emailCol: 'guest_email', nameCol: 'guest_name' },
    { table: 'car_bookings', emailCol: 'guest_email', nameCol: 'guest_name' },
    { table: 'package_bookings', emailCol: 'guest_email', nameCol: 'guest_name' },
  ]

  for (const { table, emailCol, nameCol } of lookups) {
    const { data } = await supabaseAdmin
      .from(table)
      .select(`${emailCol}, ${nameCol}`)
      .eq('guest_token', token)
      .maybeSingle()

    if (data) {
      const row = data as unknown as Record<string, string>
      return { email: row[emailCol], name: row[nameCol] }
    }
  }

  return null
}

async function mergeGuestBookings(email: string, userId: string) {
  const merges: Array<{ table: 'bookings' | 'room_bookings' | 'car_bookings' | 'package_bookings'; emailCol: string }> = [
    { table: 'bookings', emailCol: 'passenger_email' },
    { table: 'room_bookings', emailCol: 'guest_email' },
    { table: 'car_bookings', emailCol: 'guest_email' },
    { table: 'package_bookings', emailCol: 'guest_email' },
  ]

  await Promise.all(
    merges.map(({ table, emailCol }) =>
      supabaseAdmin
        .from(table)
        .update({ buyer_id: userId })
        .ilike(emailCol, email)
        .is('buyer_id', null)
    )
  )
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  return data?.id ?? null
}
