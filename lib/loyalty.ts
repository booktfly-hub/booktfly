import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Server-side helper: award points for a completed booking.
 * Simple rule: 1 point per 10 SAR spent, rounded down.
 */
export async function awardBookingPoints(params: {
  userId: string
  bookingId: string
  bookingKind: 'trip' | 'room' | 'car' | 'package'
  totalAmount: number
  description?: string
}) {
  const pointsEarned = Math.floor(params.totalAmount / 10)
  if (pointsEarned <= 0) return

  // Upsert wallet
  const { data: existing } = await supabaseAdmin
    .from('loyalty_wallets')
    .select('*')
    .eq('user_id', params.userId)
    .maybeSingle()

  const newBalance = (existing?.balance_points ?? 0) + pointsEarned
  const newLifetime = (existing?.lifetime_points ?? 0) + pointsEarned
  const tier: 'silver' | 'gold' | 'platinum' =
    newLifetime >= 50000 ? 'platinum' : newLifetime >= 10000 ? 'gold' : 'silver'

  await supabaseAdmin.from('loyalty_wallets').upsert({
    user_id: params.userId,
    balance_points: newBalance,
    lifetime_points: newLifetime,
    tier,
    updated_at: new Date().toISOString(),
  })

  await supabaseAdmin.from('loyalty_transactions').insert({
    user_id: params.userId,
    kind: 'earn',
    points: pointsEarned,
    booking_id: params.bookingId,
    booking_kind: params.bookingKind,
    description: params.description ?? `Earned ${pointsEarned} pts on booking`,
  })

  return pointsEarned
}

export async function redeemPoints(params: {
  userId: string
  points: number
  bookingId?: string
  bookingKind?: string
  description?: string
}) {
  const { data: wallet } = await supabaseAdmin
    .from('loyalty_wallets')
    .select('*')
    .eq('user_id', params.userId)
    .maybeSingle()
  if (!wallet || wallet.balance_points < params.points) {
    throw new Error('Insufficient points')
  }

  await supabaseAdmin.from('loyalty_wallets').update({
    balance_points: wallet.balance_points - params.points,
    updated_at: new Date().toISOString(),
  }).eq('user_id', params.userId)

  await supabaseAdmin.from('loyalty_transactions').insert({
    user_id: params.userId,
    kind: 'redeem',
    points: -params.points,
    booking_id: params.bookingId ?? null,
    booking_kind: params.bookingKind ?? null,
    description: params.description ?? `Redeemed ${params.points} pts`,
  })
}
