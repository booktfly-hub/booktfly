import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { optimizeImage } from '@/lib/optimize-image'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: booking } = await supabaseAdmin
      .from('package_bookings')
      .select('id, status')
      .eq('id', id)
      .single()

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'payment_processing') {
      return NextResponse.json({ error: 'Booking is not awaiting payment' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('receipt') as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const filePath = `package-receipts/${id}/${Date.now()}.webp`
    const rawBuffer = Buffer.from(await file.arrayBuffer())
    const { buffer, contentType } = await optimizeImage(rawBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('package-images')
      .upload(filePath, buffer, { contentType, upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload receipt' }, { status: 500 })
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('package-images')
      .getPublicUrl(filePath)

    await supabaseAdmin
      .from('package_bookings')
      .update({ transfer_receipt_url: publicUrl.publicUrl })
      .eq('id', id)

    return NextResponse.json({ url: publicUrl.publicUrl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
