import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/bookings/[id]/itinerary
 * Returns itinerary as HTML (server-generated).
 * Client fetches this then pipes through browser print-to-PDF,
 * avoiding a heavy PDF npm dependency.
 *
 * Guest access: pass ?token=<guest_token>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const guestToken = searchParams.get('token')

  // Access control: owner OR valid guest token
  let booking: Record<string, unknown> | null = null

  if (guestToken) {
    const { data } = await supabaseAdmin
      .from('bookings')
      .select('*, trip:trips(*), provider:providers(*)')
      .eq('id', id)
      .eq('guest_token', guestToken)
      .maybeSingle()
    booking = data
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const { data } = await supabase
      .from('bookings')
      .select('*, trip:trips(*), provider:providers(*)')
      .eq('id', id)
      .eq('buyer_id', user.id)
      .maybeSingle()
    booking = data
  }

  if (!booking) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const html = renderItineraryHtml(booking)
  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

function renderItineraryHtml(b: Record<string, unknown>): string {
  const trip = (b.trip as Record<string, unknown>) ?? {}
  const provider = (b.provider as Record<string, unknown>) ?? {}
  const dep = trip.departure_at ? new Date(trip.departure_at as string) : null
  const depStr = dep ? dep.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' }) : '—'

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>BookitFly Itinerary · ${b.reference_code ?? ''}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #0f172a; max-width: 760px; margin: 24px auto; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0ea5e9; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .ref { font-family: ui-monospace, monospace; font-size: 14px; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; }
  .section { margin: 16px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 10px; }
  .section h2 { font-size: 13px; text-transform: uppercase; color: #64748b; margin: 0 0 10px; letter-spacing: 1px; }
  .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
  .route { display: flex; gap: 20px; align-items: center; margin-top: 8px; }
  .city { font-size: 28px; font-weight: 900; }
  .code { font-size: 13px; color: #64748b; font-weight: 700; letter-spacing: 2px; }
  .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { margin: 0; max-width: none; } }
</style>
</head>
<body onload="window.print()">
  <div class="header">
    <div>
      <h1>Flight itinerary</h1>
      <p style="margin:0;color:#64748b;font-size:13px;">Issued by BookitFly</p>
    </div>
    <div class="ref">${b.reference_code ?? ''}</div>
  </div>

  <div class="section">
    <h2>Passenger</h2>
    <div class="row"><strong>${b.passenger_name ?? ''}</strong></div>
    <div class="row">Email: <span>${b.passenger_email ?? ''}</span></div>
    <div class="row">Phone: <span>${b.passenger_phone ?? ''}</span></div>
  </div>

  <div class="section">
    <h2>Flight</h2>
    <div class="row"><strong>${trip.airline ?? ''} ${trip.flight_number ? '· ' + trip.flight_number : ''}</strong></div>
    <div class="route">
      <div>
        <div class="city">${trip.origin_city_en ?? trip.origin_city_ar ?? ''}</div>
        <div class="code">${(trip.origin_code as string)?.toUpperCase() ?? ''}</div>
      </div>
      <div style="flex:1;text-align:center;color:#94a3b8;">✈</div>
      <div style="text-align:right;">
        <div class="city">${trip.destination_city_en ?? trip.destination_city_ar ?? ''}</div>
        <div class="code">${(trip.destination_code as string)?.toUpperCase() ?? ''}</div>
      </div>
    </div>
    <div class="row" style="margin-top:12px;">
      <span>Departure</span><strong>${depStr}</strong>
    </div>
    <div class="row"><span>Class</span><strong>${trip.cabin_class ?? ''}</strong></div>
    <div class="row"><span>Seats</span><strong>${b.seats_count ?? 1}</strong></div>
  </div>

  <div class="section">
    <h2>Payment</h2>
    <div class="row"><span>Total paid</span><strong>${b.total_amount ?? 0} ${(trip.currency as string) ?? 'SAR'}</strong></div>
    <div class="row"><span>Status</span><strong>${b.status ?? ''}</strong></div>
  </div>

  ${provider.company_name_en ? `
  <div class="section">
    <h2>Provider</h2>
    <div class="row"><strong>${provider.company_name_en}</strong></div>
  </div>
  ` : ''}

  <p class="footer">
    BookitFly · Present this itinerary with your passport at the airport.
  </p>
</body>
</html>`
}
