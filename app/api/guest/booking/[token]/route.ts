import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { optimizeImage } from '@/lib/optimize-image'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, passenger_name, passenger_email, seats_count, total_amount, status, transfer_receipt_url, booking_type, price_per_seat, created_at, trip:trips(airline, origin_city_en, origin_city_ar, destination_city_en, destination_city_ar, departure_at, return_at, cabin_class)')
      .eq('guest_token', token)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const { data: bankInfo } = await supabaseAdmin
      .from('platform_settings')
      .select('bank_name_en, bank_iban, bank_account_holder_en')
      .limit(1)
      .single()

    return NextResponse.json({ booking, bank: bankInfo })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('guest_token', token)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'Booking is not awaiting payment' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('receipt') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filePath = `transfer-receipts/${booking.id}/${Date.now()}.webp`
    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const { buffer, contentType } = await optimizeImage(rawBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('trip-images')
      .upload(filePath, buffer, { contentType, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 })
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('trip-images')
      .getPublicUrl(filePath)

    await supabaseAdmin
      .from('bookings')
      .update({
        transfer_receipt_url: publicUrl.publicUrl,
        transfer_confirmed_at: new Date().toISOString(),
      })
      .eq('id', booking.id)

    return NextResponse.json({ url: publicUrl.publicUrl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
