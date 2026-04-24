import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { notify } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const providerId = searchParams.get('provider_id')
  const tripId = searchParams.get('trip_id')
  const roomId = searchParams.get('room_id')
  const carId = searchParams.get('car_id')
  const packageId = searchParams.get('package_id')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(id, full_name, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (providerId) query = query.eq('provider_id', providerId)
  if (tripId) query = query.eq('trip_id', tripId)
  if (roomId) query = query.eq('room_id', roomId)
  if (carId) query = query.eq('car_id', carId)
  if (packageId) query = query.eq('package_id', packageId)

  const { data: reviews, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  const avgRating = reviews && reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0

  return NextResponse.json({
    reviews: reviews || [],
    total: count || 0,
    avg_rating: Math.round(avgRating * 10) / 10,
  })
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 5, windowMs: 60_000 })
    if (limited) return limited

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { booking_id, provider_id, trip_id, room_id, car_id, package_id, item_type, rating, comment } = body

    if (!booking_id || !provider_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Verify the booking belongs to this user and is confirmed
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, buyer_id, status')
      .eq('id', booking_id)
      .single()

    if (!booking || booking.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Can only review confirmed bookings' }, { status: 400 })
    }

    // Check for existing review
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('reviewer_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })
    }

    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        booking_id,
        reviewer_id: user.id,
        provider_id,
        trip_id: trip_id || null,
        room_id: room_id || null,
        car_id: car_id || null,
        package_id: package_id || null,
        item_type: item_type || 'trip',
        rating,
        comment: comment || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    // Notify provider
    const [{ data: provider }, { data: reviewerProfile }] = await Promise.all([
      supabaseAdmin.from('providers').select('user_id').eq('id', provider_id).single(),
      supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single(),
    ])

    const reviewerName = reviewerProfile?.full_name || 'A customer'

    if (provider?.user_id) {
      await notify({
        userId: provider.user_id,
        type: 'new_review',
        titleAr: 'تقييم جديد',
        titleEn: 'New Review',
        bodyAr: `حصلت على تقييم جديد: ${rating} نجوم`,
        bodyEn: `You received a new review: ${rating} stars`,
        data: { review_id: review.id },
        email: {
          subject: `New Review: ${rating}/5 Stars`,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
            <h2 style="color:#0f172a">⭐ New Review Received</h2>
            <p><strong>${reviewerName}</strong> left you a review:</p>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin:16px 0">
              <div style="font-size:24px;margin-bottom:8px">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</div>
              <p style="font-size:18px;font-weight:700;color:#78350f;margin:0">${rating}/5 stars</p>
              ${comment ? `<p style="color:#475569;margin-top:12px">"${comment}"</p>` : ''}
            </div>
            <p style="color:#64748b;font-size:14px">Log in to your provider dashboard to view all your reviews.</p>
          </div>`,
        },
      })
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
