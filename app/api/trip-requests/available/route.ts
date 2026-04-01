import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: provider } = await supabaseAdmin
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'Not a provider' }, { status: 403 })
    }

    const { data: requests, error } = await supabaseAdmin
      .from('flight_requests')
      .select('*')
      .in('status', ['pending', 'offered'])
      .order('created_at', { ascending: false })

    if (error) throw error

    const requestIds = (requests || []).map((r: { id: string }) => r.id)

    let myOffers: Record<string, unknown>[] = []
    if (requestIds.length > 0) {
      const { data: offersData } = await supabaseAdmin
        .from('trip_request_offers')
        .select('*')
        .eq('provider_id', provider.id)
        .in('request_id', requestIds)

      myOffers = offersData || []
    }

    const myOffersByRequest: Record<string, unknown> = {}
    for (const offer of myOffers) {
      myOffersByRequest[(offer as { request_id: string }).request_id] = offer
    }

    const result = (requests || []).map((req: { id: string }) => ({
      ...req,
      my_offer: myOffersByRequest[req.id] || null,
    }))

    return NextResponse.json({ requests: result })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
