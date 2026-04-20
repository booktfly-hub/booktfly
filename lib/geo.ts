import type { NextRequest } from 'next/server'
import crypto from 'crypto'

/**
 * Reads Vercel geolocation headers (falls back to empty for local dev).
 * Reference: https://vercel.com/docs/edge-network/headers#x-vercel-ip-country
 */
export function getGeoFromRequest(request: NextRequest) {
  const h = request.headers
  const country = h.get('x-vercel-ip-country') || null
  const city = decodeURIComponent(h.get('x-vercel-ip-city') || '') || null
  const region = h.get('x-vercel-ip-country-region') || null
  const rawIp = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || ''
  const userAgent = h.get('user-agent') || null
  const referrer = h.get('referer') || null
  return { country, city, region, rawIp, userAgent, referrer }
}

/**
 * Hashes an IP with a daily-rotating salt so we do not store raw IPs (Saudi PDPL).
 */
export function hashIp(rawIp: string) {
  if (!rawIp) return null
  const daily = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return crypto
    .createHash('sha256')
    .update(`${rawIp}|${daily}|bookitfly`)
    .digest('hex')
    .slice(0, 32)
}
