import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')
    const provider_id = searchParams.get('provider_id')

    // Build query for confirmed bookings
    let query = supabaseAdmin
      .from('bookings')
      .select('id, provider_id, total_amount, commission_amount, provider_payout, created_at, providers:provider_id(company_name_ar, company_name_en)')
      .eq('status', 'confirmed')

    if (date_from) {
      query = query.gte('created_at', date_from)
    }

    if (date_to) {
      query = query.lte('created_at', date_to)
    }

    if (provider_id) {
      query = query.eq('provider_id', provider_id)
    }

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    const bookingsList = bookings || []

    // Calculate totals
    let gross_revenue = 0
    let total_commissions = 0
    let provider_payouts = 0

    // Build by-provider breakdown
    const providerMap: Record<string, {
      provider_id: string
      company_name_ar: string
      company_name_en: string | null
      gross_revenue: number
      commission: number
      payout: number
      booking_count: number
    }> = {}

    for (const booking of bookingsList) {
      gross_revenue += booking.total_amount
      total_commissions += booking.commission_amount
      provider_payouts += booking.provider_payout

      const pid = booking.provider_id
      if (!providerMap[pid]) {
        const providerInfo = booking.providers as { company_name_ar: string; company_name_en: string | null } | null
        providerMap[pid] = {
          provider_id: pid,
          company_name_ar: providerInfo?.company_name_ar || '',
          company_name_en: providerInfo?.company_name_en || null,
          gross_revenue: 0,
          commission: 0,
          payout: 0,
          booking_count: 0,
        }
      }

      providerMap[pid].gross_revenue += booking.total_amount
      providerMap[pid].commission += booking.commission_amount
      providerMap[pid].payout += booking.provider_payout
      providerMap[pid].booking_count++
    }

    const by_provider = Object.values(providerMap).sort(
      (a, b) => b.gross_revenue - a.gross_revenue
    )

    return NextResponse.json({
      gross_revenue,
      total_commissions,
      provider_payouts,
      booking_count: bookingsList.length,
      by_provider,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
