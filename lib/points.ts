import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'

/**
 * Award points to the marketeer who directly booked for a guest (booked_by_marketeer_id).
 */
export async function handleMarkeeteerDirectBookingRewards({
  marketeerDbId,
  bookingId,
  totalAmount,
  passengerName,
  type,
  refLabel,
}: {
  marketeerDbId: string
  bookingId: string
  totalAmount: number
  passengerName: string
  type: 'flight' | 'room'
  refLabel: string
}) {
  const { data: marketeer } = await supabaseAdmin
    .from('marketeers')
    .select('user_id, referred_by_marketeer_id')
    .eq('id', marketeerDbId)
    .single()

  if (!marketeer) return

  const pointsForSale = type === 'flight' ? 500 : 300
  const eventType = type === 'flight' ? 'sell_ticket' : 'sell_hotel'
  const labelAr = type === 'flight' ? 'تذكرة طيران' : 'حجز فندق'
  const labelEn = type === 'flight' ? 'flight ticket' : 'hotel room'

  await supabaseAdmin.from('flypoints_transactions').insert({
    marketeer_id: marketeer.user_id,
    points: pointsForSale,
    event_type: eventType,
    reference_id: bookingId,
    description_ar: `نقاط بيع ${labelAr} لعميل ${passengerName} - حجز ${refLabel}`,
    description_en: `Points for selling ${labelEn} for ${passengerName} - booking ${refLabel}`,
  })

  await notify({
    userId: marketeer.user_id,
    type: 'points_earned',
    titleAr: `تم تأكيد دفع عميلك! +${pointsForSale} نقطة`,
    titleEn: `Customer payment confirmed! +${pointsForSale} points`,
    bodyAr: `تم تأكيد دفع ${passengerName} لحجز ${labelAr} (${refLabel}). حصلت على ${pointsForSale} نقطة!`,
    bodyEn: `${passengerName}'s payment for ${labelEn} booking (${refLabel}) confirmed. You earned ${pointsForSale} points!`,
    data: { points: String(pointsForSale), event: eventType, booking_id: bookingId },
  })

  // If this marketeer was invited by another, award 5% commission
  if (marketeer.referred_by_marketeer_id) {
    const { data: parentMkt } = await supabaseAdmin
      .from('marketeers')
      .select('user_id')
      .eq('id', marketeer.referred_by_marketeer_id)
      .single()

    if (parentMkt) {
      const commissionPoints = Math.round((totalAmount * 5) / 100)
      if (commissionPoints > 0) {
        await supabaseAdmin.from('flypoints_transactions').insert({
          marketeer_id: parentMkt.user_id,
          points: commissionPoints,
          event_type: 'referral_client_booking',
          reference_id: bookingId,
          description_ar: `عمولة 5% من بيع مسوّقك - حجز ${refLabel}`,
          description_en: `5% commission from your marketeer's sale - booking ${refLabel}`,
        })

        await notify({
          userId: parentMkt.user_id,
          type: 'points_earned',
          titleAr: 'حصلت على عمولة من مسوّقك!',
          titleEn: 'You earned commission from your marketeer!',
          bodyAr: `حصلت على ${commissionPoints} نقطة (5% عمولة) من حجز عميل مسوّقك (${refLabel})`,
          bodyEn: `You earned ${commissionPoints} points (5% commission) from your marketeer's customer booking (${refLabel})`,
          data: { points: String(commissionPoints), event: 'referral_client_booking', booking_id: bookingId },
        })
      }
    }
  }
}

/**
 * Award points to the marketeer who referred the buyer when a booking is confirmed.
 * Also awards first-booking bonus to the customer.
 */
export async function handleBookingConfirmedRewards({
  buyerId,
  bookingId,
  totalAmount,
  type,
  refLabel,
}: {
  buyerId: string
  bookingId: string
  totalAmount: number
  type: 'flight' | 'room'
  refLabel: string
}) {
  // 1. Customer first-booking bonus (500 pts)
  const { data: existingBonus } = await supabaseAdmin
    .from('customer_points_transactions')
    .select('id')
    .eq('user_id', buyerId)
    .eq('event_type', 'first_booking')
    .maybeSingle()

  if (!existingBonus) {
    await supabaseAdmin.from('customer_points_transactions').insert({
      user_id: buyerId,
      points: 500,
      event_type: 'first_booking',
      reference_id: bookingId,
      description_ar: 'مكافأة أول حجز',
      description_en: 'First booking bonus',
    })

    await notify({
      userId: buyerId,
      type: 'points_earned',
      titleAr: 'مبروك! حصلت على 500 نقطة',
      titleEn: 'Congrats! You earned 500 points',
      bodyAr: 'حصلت على 500 نقطة كمكافأة أول حجز لك!',
      bodyEn: 'You earned 500 points as a first booking bonus!',
      data: { points: '500', event: 'first_booking', booking_id: bookingId },
    })
  }

  // 2. Check if buyer was referred by a marketeer
  const { data: buyerProfile } = await supabaseAdmin
    .from('profiles')
    .select('referred_by, full_name')
    .eq('id', buyerId)
    .single()

  if (!buyerProfile?.referred_by?.startsWith('MKT-')) return

  const { data: marketeer } = await supabaseAdmin
    .from('marketeers')
    .select('id, user_id, referred_by_marketeer_id')
    .eq('referral_code', buyerProfile.referred_by)
    .eq('status', 'active')
    .maybeSingle()

  if (!marketeer) return

  const pointsForSale = type === 'flight' ? 500 : 300
  const eventType = type === 'flight' ? 'sell_ticket' : 'sell_hotel'
  const labelAr = type === 'flight' ? 'تذكرة طيران' : 'حجز فندق'
  const labelEn = type === 'flight' ? 'flight ticket' : 'hotel room'

  // Award marketeer points for the sale
  await supabaseAdmin.from('flypoints_transactions').insert({
    marketeer_id: marketeer.user_id,
    points: pointsForSale,
    event_type: eventType,
    reference_id: bookingId,
    description_ar: `نقاط بيع ${labelAr} - حجز ${refLabel}`,
    description_en: `Points for selling ${labelEn} - booking ${refLabel}`,
  })

  await notify({
    userId: marketeer.user_id,
    type: 'points_earned',
    titleAr: `عميلك حجز ${labelAr}!`,
    titleEn: `Your referral booked a ${labelEn}!`,
    bodyAr: `${buyerProfile.full_name} أتم حجز ${labelAr} (${refLabel}). حصلت على ${pointsForSale} نقطة!`,
    bodyEn: `${buyerProfile.full_name} completed a ${labelEn} booking (${refLabel}). You earned ${pointsForSale} points!`,
    data: { points: String(pointsForSale), event: eventType, booking_id: bookingId },
  })

  // 3. Circle 3: If this marketeer was invited by another marketeer, award 5% commission
  if (marketeer.referred_by_marketeer_id) {
    const { data: parentMkt } = await supabaseAdmin
      .from('marketeers')
      .select('user_id')
      .eq('id', marketeer.referred_by_marketeer_id)
      .single()

    if (parentMkt) {
      const commissionPercent = 5
      const commissionPoints = Math.round((totalAmount * commissionPercent) / 100)

      if (commissionPoints > 0) {
        await supabaseAdmin.from('flypoints_transactions').insert({
          marketeer_id: parentMkt.user_id,
          points: commissionPoints,
          event_type: 'referral_client_booking',
          reference_id: bookingId,
          description_ar: `عمولة 5% من بيع مسوّقك - حجز ${refLabel}`,
          description_en: `5% commission from your marketeer's sale - booking ${refLabel}`,
        })

        await notify({
          userId: parentMkt.user_id,
          type: 'points_earned',
          titleAr: 'حصلت على عمولة من مسوّقك!',
          titleEn: 'You earned commission from your marketeer!',
          bodyAr: `حصلت على ${commissionPoints} نقطة (5% عمولة) من حجز عميل مسوّقك (${refLabel})`,
          bodyEn: `You earned ${commissionPoints} points (5% commission) from your marketeer's customer booking (${refLabel})`,
          data: { points: String(commissionPoints), event: 'referral_client_booking', booking_id: bookingId },
        })
      }
    }
  }
}
