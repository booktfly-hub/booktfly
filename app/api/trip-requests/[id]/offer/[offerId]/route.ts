import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  try {
    const { id: requestId, offerId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: flightRequest } = await supabaseAdmin
      .from('flight_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!flightRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const isOwner = flightRequest.user_id === user.id || flightRequest.marketeer_id === user.id
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: offer } = await supabaseAdmin
      .from('trip_request_offers')
      .select('*, provider:providers(id, user_id, company_name_ar, company_name_en)')
      .eq('id', offerId)
      .eq('request_id', requestId)
      .single()

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (offer.status !== 'pending') {
      return NextResponse.json({ error: 'Offer already responded to' }, { status: 400 })
    }

    const body = await request.json()
    const action = body.action as string

    if (action === 'accept') {
      await supabaseAdmin
        .from('trip_request_offers')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', offerId)

      await supabaseAdmin
        .from('trip_request_offers')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('request_id', requestId)
        .neq('id', offerId)
        .eq('status', 'pending')

      await supabaseAdmin
        .from('flight_requests')
        .update({ status: 'reviewed' })
        .eq('id', requestId)

      if (offer.provider?.user_id) {
        await notify({
          userId: offer.provider.user_id,
          type: 'trip_request_offer_accepted',
          titleAr: 'تم قبول عرضك!',
          titleEn: 'Your offer was accepted!',
          bodyAr: `قبل ${flightRequest.name} عرضك على رحلة ${flightRequest.origin} → ${flightRequest.destination}`,
          bodyEn: `${flightRequest.name} accepted your offer for ${flightRequest.origin} → ${flightRequest.destination}`,
          data: { flight_request_id: requestId, offer_id: offerId },
        })
      }

      logActivity('trip_request_offer_accepted', {
        userId: user.id,
        metadata: { requestId, offerId },
      })

      return NextResponse.json({ success: true, action: 'accepted' })
    }

    if (action === 'reject') {
      await supabaseAdmin
        .from('trip_request_offers')
        .update({ status: 'rejected', responded_at: new Date().toISOString() })
        .eq('id', offerId)

      const { count } = await supabaseAdmin
        .from('trip_request_offers')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', requestId)
        .eq('status', 'pending')

      if (!count || count === 0) {
        await supabaseAdmin
          .from('flight_requests')
          .update({ status: 'pending' })
          .eq('id', requestId)
      }

      if (offer.provider?.user_id) {
        await notify({
          userId: offer.provider.user_id,
          type: 'trip_request_offer_rejected',
          titleAr: 'تم رفض عرضك',
          titleEn: 'Your offer was rejected',
          bodyAr: `رفض ${flightRequest.name} عرضك على رحلة ${flightRequest.origin} → ${flightRequest.destination}`,
          bodyEn: `${flightRequest.name} rejected your offer for ${flightRequest.origin} → ${flightRequest.destination}`,
          data: { flight_request_id: requestId, offer_id: offerId },
        })
      }

      return NextResponse.json({ success: true, action: 'rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
