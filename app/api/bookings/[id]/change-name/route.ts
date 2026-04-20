import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { notify } from '@/lib/notifications'
import { shortId } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  // For flight bookings (passengers jsonb)
  passenger_index: z.number().int().min(0).default(0),
  new_first_name: z.string().min(2).max(60),
  new_last_name: z.string().min(2).max(60),
  // For guests (rooms/cars/packages also use guest flow)
  guest_token: z.string().uuid().optional(),
  // Which booking table to target; defaults to flight bookings for backward compat
  target_type: z.enum(['booking', 'room_booking', 'car_booking', 'package_booking']).default('booking'),
})

const TABLE_MAP = {
  booking: {
    table: 'bookings',
    itemTable: 'trips',
    itemJoinKey: 'trip_id',
    itemFields: 'name_change_allowed, name_change_fee, name_change_is_refundable',
    kindAr: 'رحلة', kindEn: 'flight',
  },
  room_booking: {
    table: 'room_bookings',
    itemTable: 'rooms',
    itemJoinKey: 'room_id',
    itemFields: 'name_change_allowed, name_change_fee, name_change_is_refundable',
    kindAr: 'غرفة', kindEn: 'room',
  },
  car_booking: {
    table: 'car_bookings',
    itemTable: 'cars',
    itemJoinKey: 'car_id',
    itemFields: 'name_change_allowed, name_change_fee, name_change_is_refundable',
    kindAr: 'سيارة', kindEn: 'car',
  },
  package_booking: {
    table: 'package_bookings',
    itemTable: 'packages',
    itemJoinKey: 'package_id',
    itemFields: 'name_change_allowed, name_change_fee, name_change_is_refundable',
    kindAr: 'باقة', kindEn: 'package',
  },
} as const

type RouteParams = { params: Promise<{ id: string }> }

type Policy = { name_change_allowed: boolean; name_change_fee: number; name_change_is_refundable: boolean }
type Passenger = { first_name: string; last_name: string } & Record<string, unknown>
type ProvRef = { user_id?: string | null }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const limited = rateLimit(request, { limit: 5, windowMs: 60_000 })
    if (limited) return limited

    const { id: bookingId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const raw = await request.json()
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { passenger_index, new_first_name, new_last_name, guest_token, target_type } = parsed.data
    const { table, itemTable, itemJoinKey, kindAr, kindEn } = TABLE_MAP[target_type]

    // Fetch booking + policy
    const selectCols = target_type === 'booking'
      ? `id, buyer_id, guest_token, passenger_name, passengers, name_change_count, name_change_fee_paid, provider:providers(user_id), trip:${itemTable}(name_change_allowed, name_change_fee, name_change_is_refundable)`
      : `id, buyer_id, guest_token, guest_name, name_change_count, name_change_fee_paid, provider:providers(user_id), item:${itemTable}(name_change_allowed, name_change_fee, name_change_is_refundable)`
    const { data: booking } = await supabaseAdmin.from(table).select(selectCols).eq('id', bookingId).single() as unknown as { data: Record<string, unknown> | null }

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const isOwner = user?.id && booking.buyer_id === user.id
    const isGuest = !user && guest_token && booking.guest_token === guest_token
    if (!isOwner && !isGuest) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const policyRaw = target_type === 'booking' ? booking.trip : booking.item
    const policy = (Array.isArray(policyRaw) ? policyRaw[0] : policyRaw) as Policy | null
    if (!policy?.name_change_allowed) {
      return NextResponse.json({ error: 'Name change is not allowed on this item' }, { status: 400 })
    }

    const fee = Number(policy.name_change_fee ?? 0)
    const refundable = Boolean(policy.name_change_is_refundable)
    const ref = shortId(bookingId)
    const newFullName = `${new_first_name} ${new_last_name}`

    // Branch: passengers jsonb vs single guest_name
    let oldName = ''
    const nameChangeCount = Number(booking.name_change_count || 0) + 1
    const nameChangeFeePaid = Number(booking.name_change_fee_paid || 0) + fee

    if (target_type === 'booking') {
      let passengers = Array.isArray(booking.passengers) ? (booking.passengers as Passenger[]) : []
      if (passengers.length === 0) {
        const [first = '', ...rest] = String(booking.passenger_name || '').split(' ')
        passengers = [{ first_name: first, last_name: rest.join(' ') }]
      }
      if (passenger_index >= passengers.length) {
        return NextResponse.json({ error: 'Passenger index out of range' }, { status: 400 })
      }
      oldName = `${passengers[passenger_index].first_name} ${passengers[passenger_index].last_name}`.trim()
      passengers[passenger_index] = {
        ...passengers[passenger_index],
        first_name: new_first_name,
        last_name: new_last_name,
      }
      const newPassengerName = passenger_index === 0 ? newFullName : String(booking.passenger_name || '')
      const { error } = await supabaseAdmin.from(table).update({
        passengers,
        passenger_name: newPassengerName,
        name_change_count: nameChangeCount,
        name_change_fee_paid: nameChangeFeePaid,
      }).eq('id', bookingId)
      if (error) return NextResponse.json({ error: 'Failed to update passenger' }, { status: 500 })
    } else {
      oldName = String(booking.guest_name || '')
      const { error } = await supabaseAdmin.from(table).update({
        guest_name: newFullName,
        name_change_count: nameChangeCount,
        name_change_fee_paid: nameChangeFeePaid,
      }).eq('id', bookingId)
      if (error) return NextResponse.json({ error: 'Failed to update guest name' }, { status: 500 })
    }

    // Notify provider + buyer
    try {
      const providerObj = (Array.isArray(booking.provider) ? booking.provider[0] : booking.provider) as ProvRef | null
      if (providerObj?.user_id) {
        await notify({
          userId: providerObj.user_id,
          type: 'name_change_requested',
          titleAr: 'طلب تغيير اسم',
          titleEn: 'Name change',
          bodyAr: `تم تغيير الاسم على حجز ${kindAr} #${ref}. من: ${oldName} → إلى: ${newFullName}. رسوم: ${fee} ريال${refundable ? ' (قابل للاسترداد)' : ''}.`,
          bodyEn: `Name changed on ${kindEn} booking #${ref}. From: ${oldName} → To: ${newFullName}. Fee: ${fee} SAR${refundable ? ' (refundable)' : ''}.`,
          data: { booking_id: bookingId, booking_kind: target_type, old_name: oldName, new_name: newFullName, fee: String(fee) },
        })
      }
      if (user?.id) {
        await notify({
          userId: user.id,
          type: 'name_change_requested',
          titleAr: 'تم تحديث الاسم',
          titleEn: 'Name updated',
          bodyAr: `تم تحديث الاسم على حجز ${kindAr} #${ref}. الرسوم: ${fee} ريال.`,
          bodyEn: `Name updated on ${kindEn} booking #${ref}. Fee charged: ${fee} SAR.`,
          data: { booking_id: bookingId, booking_kind: target_type },
        })
      }
    } catch (e) {
      console.error('name-change notify error:', e)
    }

    return NextResponse.json({ ok: true, fee, refundable, name_change_count: nameChangeCount })
  } catch (err) {
    console.error('change-name error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
