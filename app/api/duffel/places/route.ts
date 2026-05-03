import { NextRequest, NextResponse } from 'next/server'
import { duffel } from '@/lib/duffel'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ places: [] })
  }

  try {
    const res = await duffel.suggestions.list({ query: q })
    const places = (res.data || []).map((p: any) => ({
      id: p.id,
      iata_code: p.iata_code,
      iata_city_code: p.iata_city_code,
      name: p.name,
      city_name: p.city_name ?? p.city?.name ?? null,
      country: p.iata_country_code,
      type: p.type,
    }))
    return NextResponse.json({ places })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'duffel_error' },
      { status: 500 }
    )
  }
}
