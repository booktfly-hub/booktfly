import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    // Fetch the booking
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, trips:trip_id(origin_city_ar, origin_city_en, destination_city_ar, destination_city_en)')
      .eq('id', id)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking is already cancelled' }, { status: 400 })
    }

    if (booking.status === 'refunded') {
      return NextResponse.json({ error: 'Cannot cancel a refunded booking' }, { status: 400 })
    }

    // Update booking status
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
    }

    // Release seats back to the trip if booking was confirmed
    if (booking.status === 'confirmed') {
      const { error: rpcError } = await supabaseAdmin.rpc('release_seats', {
        p_trip_id: booking.trip_id,
        p_seats: booking.seats_count,
      })

      if (rpcError) {
        console.error('Failed to release seats:', rpcError)
      }
    }

    // Notify the buyer
    const tripInfo = booking.trips as { origin_city_ar: string; origin_city_en: string | null; destination_city_ar: string; destination_city_en: string | null } | null
    await notify({
      userId: booking.buyer_id,
      type: 'booking_refunded',
      titleAr: 'تم إلغاء حجزك',
      titleEn: 'Booking Cancelled',
      bodyAr: `تم إلغاء حجزك من ${tripInfo?.origin_city_ar || ''} إلى ${tripInfo?.destination_city_ar || ''}`,
      bodyEn: `Your booking from ${tripInfo?.origin_city_en || tripInfo?.origin_city_ar || ''} to ${tripInfo?.destination_city_en || tripInfo?.destination_city_ar || ''} has been cancelled`,
      data: { booking_id: booking.id },
      email: {
        subject: 'Booking Cancelled - BooktFly',
        html: `<p>Your booking has been cancelled by an administrator.</p><p>If you believe this was an error, please contact support.</p>`,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
