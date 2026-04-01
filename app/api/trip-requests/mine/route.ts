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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const isMarketeer = profile.role === 'marketeer'
    const filterCol = isMarketeer ? 'marketeer_id' : 'user_id'

    const { data: requests, error } = await supabaseAdmin
      .from('flight_requests')
      .select('*')
      .eq(filterCol, user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const requestIds = (requests || []).map((r: { id: string }) => r.id)

    let offers: Record<string, unknown>[] = []
    if (requestIds.length > 0) {
      const { data: offersData } = await supabaseAdmin
        .from('trip_request_offers')
        .select('*, provider:providers(id, company_name_ar, company_name_en, logo_url)')
        .in('request_id', requestIds)
        .order('created_at', { ascending: false })

      offers = offersData || []
    }

    const offersByRequest: Record<string, unknown[]> = {}
    for (const offer of offers) {
      const rid = (offer as { request_id: string }).request_id
      if (!offersByRequest[rid]) offersByRequest[rid] = []
      offersByRequest[rid].push(offer)
    }

    const result = (requests || []).map((req: { id: string }) => ({
      ...req,
      offers: offersByRequest[req.id] || [],
    }))

    return NextResponse.json({ requests: result })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
