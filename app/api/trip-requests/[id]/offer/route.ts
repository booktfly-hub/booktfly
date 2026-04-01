import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { tripRequestOfferSchema } from '@/lib/validations'
import { notify } from '@/lib/notifications'
import { render } from '@react-email/components'
import TripRequestOfferEmail from '@/emails/trip-request-offer'
import { Resend } from 'resend'
import { logActivity } from '@/lib/activity-log'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: provider } = await supabaseAdmin
      .from('providers')
      .select('id, company_name_ar, company_name_en')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'Not an active provider' }, { status: 403 })
    }

    const { data: flightRequest } = await supabaseAdmin
      .from('flight_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (!flightRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (!['pending', 'offered'].includes(flightRequest.status)) {
      return NextResponse.json({ error: 'Request is no longer accepting offers' }, { status: 400 })
    }

    const { data: existingOffer } = await supabaseAdmin
      .from('trip_request_offers')
      .select('id')
      .eq('request_id', requestId)
      .eq('provider_id', provider.id)
      .single()

    if (existingOffer) {
      return NextResponse.json({ error: 'You already made an offer on this request' }, { status: 409 })
    }

    const body = await request.json()
    const parsed = tripRequestOfferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const totalPrice = parsed.data.price_per_seat * flightRequest.seats_needed

    const { data: offer, error: offerError } = await supabaseAdmin
      .from('trip_request_offers')
      .insert({
        request_id: requestId,
        provider_id: provider.id,
        price_per_seat: parsed.data.price_per_seat,
        total_price: totalPrice,
        notes: parsed.data.notes || null,
        status: 'pending',
      })
      .select()
      .single()

    if (offerError) throw offerError

    await supabaseAdmin
      .from('flight_requests')
      .update({ status: 'offered' })
      .eq('id', requestId)

    if (flightRequest.user_id) {
      const emailHtml = await render(
        TripRequestOfferEmail({
          providerName: provider.company_name_ar || provider.company_name_en || '',
          origin: flightRequest.origin,
          destination: flightRequest.destination,
          departureDate: flightRequest.departure_date,
          seats: flightRequest.seats_needed,
          pricePerSeat: parsed.data.price_per_seat,
          totalPrice,
          notes: parsed.data.notes,
          locale: 'ar',
        })
      )

      await notify({
        userId: flightRequest.user_id,
        type: 'trip_request_offer_received',
        titleAr: 'عرض جديد على طلب رحلتك',
        titleEn: 'New offer on your trip request',
        bodyAr: `قدم ${provider.company_name_ar || provider.company_name_en} عرضاً بسعر ${parsed.data.price_per_seat} ر.س للمقعد`,
        bodyEn: `${provider.company_name_en || provider.company_name_ar} offered ${parsed.data.price_per_seat} SAR per seat`,
        data: { flight_request_id: requestId, offer_id: offer.id },
        email: {
          subject: 'عرض جديد على طلب رحلتك - BooktFly',
          html: emailHtml,
        },
      })
    } else if (flightRequest.email) {
      try {
        const emailHtml = await render(
          TripRequestOfferEmail({
            providerName: provider.company_name_ar || provider.company_name_en || '',
            origin: flightRequest.origin,
            destination: flightRequest.destination,
            departureDate: flightRequest.departure_date,
            seats: flightRequest.seats_needed,
            pricePerSeat: parsed.data.price_per_seat,
            totalPrice,
            notes: parsed.data.notes,
            locale: 'ar',
          })
        )

        await resend.emails.send({
          from: 'BooktFly <noreply@booktfly.com>',
          to: flightRequest.email,
          subject: 'عرض جديد على طلب رحلتك - BooktFly',
          html: emailHtml,
        })
      } catch (err) {
        console.error('Failed to send offer email:', err)
      }

      if (flightRequest.marketeer_id) {
        await notify({
          userId: flightRequest.marketeer_id,
          type: 'trip_request_offer_received',
          titleAr: 'عرض جديد على طلب العميل',
          titleEn: 'New offer on customer request',
          bodyAr: `قدم ${provider.company_name_ar || provider.company_name_en} عرضاً على طلب ${flightRequest.name}`,
          bodyEn: `${provider.company_name_en || provider.company_name_ar} made an offer on ${flightRequest.name}'s request`,
          data: { flight_request_id: requestId, offer_id: offer.id },
        })
      }
    }

    logActivity('trip_request_offer_created', {
      userId: user.id,
      metadata: { requestId, offerId: offer.id },
    })

    return NextResponse.json({ success: true, offer }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: offers, error } = await supabaseAdmin
      .from('trip_request_offers')
      .select('*, provider:providers(id, company_name_ar, company_name_en, logo_url)')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ offers: offers || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
