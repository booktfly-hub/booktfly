/**
 * Curated nearby-airports map for the major MENA / GCC region hubs that this
 * platform serves. The values are IATA codes within ~150 km of the key.
 *
 * Lookups are case-insensitive on the IATA code. If the user typed a city
 * name (not a 3-letter code), we don't expand — the existing ilike search
 * already handles fuzzy matching on city names.
 *
 * Source: hand-curated from common metro areas and regional secondary
 * airports that travellers commonly substitute. Add more as needed.
 */
const NEARBY: Record<string, string[]> = {
  // Saudi Arabia
  RUH: ['DMM', 'AHB'], // Riyadh ↔ Dammam, Abha
  JED: ['MED', 'TIF', 'YNB'], // Jeddah ↔ Madinah, Taif, Yanbu
  MED: ['JED', 'YNB'],
  DMM: ['RUH', 'BAH'], // Dammam ↔ Riyadh, Bahrain
  AHB: ['RUH', 'GIZ'],

  // UAE
  DXB: ['SHJ', 'AUH', 'DWC'], // Dubai ↔ Sharjah, Abu Dhabi, Al Maktoum
  AUH: ['DXB', 'SHJ', 'AAN'],
  SHJ: ['DXB', 'AUH'],
  DWC: ['DXB', 'SHJ'],

  // Qatar / Bahrain / Kuwait / Oman
  DOH: ['BAH', 'DMM'],
  BAH: ['DMM', 'DOH'],
  KWI: ['DMM', 'BAH'],
  MCT: ['SLL', 'DXB'],

  // Egypt
  CAI: ['HBE', 'SSH'], // Cairo ↔ Alexandria (Borg el Arab), Sharm el-Sheikh
  HBE: ['CAI'],
  SSH: ['HRG', 'CAI'],
  HRG: ['SSH'],
  LXR: ['ASW'],

  // Jordan / Lebanon
  AMM: ['AQJ'],
  AQJ: ['AMM'],
  BEY: ['DAM', 'AMM'],

  // Turkey
  IST: ['SAW'], // Istanbul Airport ↔ Sabiha Gökçen
  SAW: ['IST'],
  ESB: ['ADA'],

  // Iraq
  BGW: ['NJF', 'EBL'],
  NJF: ['BGW'],
  EBL: ['BGW', 'ISU'],
}

/**
 * Returns the input IATA code plus any nearby codes. Always includes the
 * original code first. Pass any non-IATA string (city name) and you get
 * back just the input unchanged.
 */
export function expandWithNearby(code: string): string[] {
  if (!code) return []
  const trimmed = code.trim()
  const isIata = /^[A-Z]{3}$/i.test(trimmed)
  if (!isIata) return [trimmed]
  const upper = trimmed.toUpperCase()
  const neighbours = NEARBY[upper] || []
  return [upper, ...neighbours]
}

export function isIataCode(value: string): boolean {
  return /^[A-Z]{3}$/i.test(value.trim())
}
