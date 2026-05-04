import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const revalidate = 300

type Suggestion = {
  code: string
  name_ar: string
  name_en: string
  city_ar: string
  city_en: string
  country_ar?: string
  country_en?: string
  type: 'city' | 'airport'
  has_trips: boolean
  score: number
}

type TPPlace = {
  code: string
  name: string
  city_name?: string
  country_name?: string
  type: string
  weight?: number
}

async function fetchTP(term: string, locale: 'ar' | 'en'): Promise<TPPlace[]> {
  try {
    const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(term)}&locale=${locale}&types[]=city&types[]=airport`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return []
    return (await res.json()) as TPPlace[]
  } catch {
    return []
  }
}

async function fetchDbCities() {
  const [origins, destinations] = await Promise.all([
    supabaseAdmin
      .from('trips')
      .select('origin_city_ar, origin_city_en, origin_code')
      .eq('status', 'active'),
    supabaseAdmin
      .from('trips')
      .select('destination_city_ar, destination_city_en, destination_code')
      .eq('status', 'active'),
  ])

  const map = new Map<string, { ar: string; en: string; code: string }>()
  for (const r of origins.data || []) {
    if (r.origin_code && !map.has(r.origin_code)) {
      map.set(r.origin_code, {
        code: r.origin_code,
        ar: r.origin_city_ar,
        en: r.origin_city_en || r.origin_city_ar,
      })
    }
  }
  for (const r of destinations.data || []) {
    if (r.destination_code && !map.has(r.destination_code)) {
      map.set(r.destination_code, {
        code: r.destination_code,
        ar: r.destination_city_ar,
        en: r.destination_city_en || r.destination_city_ar,
      })
    }
  }
  return map
}

function scoreMatch(query: string, candidate: string): number {
  if (!candidate) return 0
  const q = query.toLowerCase()
  const c = candidate.toLowerCase()
  if (c === q) return 100
  if (c.startsWith(q)) return 80
  if (c.includes(q)) return 50
  return 0
}

export async function GET(req: NextRequest) {
  const term = (req.nextUrl.searchParams.get('q') || '').trim()
  const locale = (req.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'ar') as 'ar' | 'en'

  // No query → return DB cities only (fast path for empty input).
  if (!term) {
    const dbCities = await fetchDbCities()
    const list: Suggestion[] = Array.from(dbCities.values())
      .slice(0, 20)
      .map((c) => ({
        code: c.code,
        name_ar: c.ar,
        name_en: c.en,
        city_ar: c.ar,
        city_en: c.en,
        type: 'city' as const,
        has_trips: true,
        score: 60,
      }))
    return NextResponse.json({ results: list })
  }

  const [tpResults, dbCities] = await Promise.all([
    fetchTP(term, locale),
    fetchDbCities(),
  ])

  // Also fetch the other locale so we can show both names in the UI.
  const otherLocale = locale === 'ar' ? 'en' : 'ar'
  const tpOther = await fetchTP(term, otherLocale)
  const otherByCode = new Map<string, TPPlace>()
  for (const p of tpOther) otherByCode.set(p.code, p)

  const merged = new Map<string, Suggestion>()

  // 1) Worldwide TP results
  for (const p of tpResults) {
    if (!p.code) continue
    const codeUpper = p.code.toUpperCase()
    const other = otherByCode.get(p.code)
    const hasTrips = dbCities.has(codeUpper)

    const nameMatch = Math.max(
      scoreMatch(term, p.name),
      scoreMatch(term, p.city_name || ''),
      other ? scoreMatch(term, other.name) : 0,
      scoreMatch(term, p.code)
    )
    const sizeBoost = Math.min(20, Math.floor((p.weight || 0) / 1000))
    const dbBoost = hasTrips ? 40 : 0
    const typeBoost = p.type === 'city' ? 5 : 0

    merged.set(codeUpper, {
      code: codeUpper,
      name_ar: locale === 'ar' ? p.name : other?.name || p.name,
      name_en: locale === 'en' ? p.name : other?.name || p.name,
      city_ar: locale === 'ar' ? p.city_name || p.name : other?.city_name || p.city_name || p.name,
      city_en: locale === 'en' ? p.city_name || p.name : other?.city_name || p.city_name || p.name,
      country_ar: locale === 'ar' ? p.country_name : other?.country_name,
      country_en: locale === 'en' ? p.country_name : other?.country_name,
      type: (p.type === 'airport' ? 'airport' : 'city') as 'city' | 'airport',
      has_trips: hasTrips,
      score: nameMatch + sizeBoost + dbBoost + typeBoost,
    })
  }

  // 2) DB cities matched directly (in case TP missed something)
  for (const c of dbCities.values()) {
    const upper = c.code.toUpperCase()
    if (merged.has(upper)) continue
    const nameMatch = Math.max(
      scoreMatch(term, c.ar),
      scoreMatch(term, c.en),
      scoreMatch(term, c.code)
    )
    if (nameMatch === 0) continue
    merged.set(upper, {
      code: upper,
      name_ar: c.ar,
      name_en: c.en,
      city_ar: c.ar,
      city_en: c.en,
      type: 'city',
      has_trips: true,
      score: nameMatch + 50,
    })
  }

  const results = Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  )
}
