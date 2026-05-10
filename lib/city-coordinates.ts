/**
 * Hand-curated lat/lng for the city IATA codes used by the hotel offers.
 * Used to plot pins on the hotel map view. Add more as the platform expands.
 */
export const CITY_COORDS: Record<string, [number, number]> = {
  // Saudi Arabia
  RUH: [24.7136, 46.6753],
  JED: [21.4858, 39.1925],
  MED: [24.4709, 39.6121],
  DMM: [26.4207, 50.0888],
  AHB: [18.2164, 42.5053],
  TIF: [21.4854, 40.5435],
  YNB: [24.0890, 38.0651],
  GIZ: [16.9011, 42.5856],

  // UAE
  DXB: [25.2048, 55.2708],
  AUH: [24.4539, 54.3773],
  SHJ: [25.3463, 55.4209],
  AAN: [24.2075, 55.7447],
  DWC: [24.8967, 55.1614],

  // Qatar / Bahrain / Kuwait / Oman
  DOH: [25.2854, 51.5310],
  BAH: [26.2285, 50.5860],
  KWI: [29.3759, 47.9774],
  MCT: [23.5880, 58.3829],
  SLL: [17.0387, 54.0913],

  // Egypt
  CAI: [30.0444, 31.2357],
  HBE: [31.2001, 29.9187],
  SSH: [27.9654, 34.3290],
  HRG: [27.2579, 33.8116],
  LXR: [25.6872, 32.6396],
  ASW: [24.0889, 32.8998],

  // Levant
  AMM: [31.9454, 35.9284],
  AQJ: [29.5267, 35.0067],
  BEY: [33.8938, 35.5018],
  DAM: [33.5138, 36.2765],

  // Turkey
  IST: [41.0082, 28.9784],
  SAW: [40.9056, 29.3092],
  ESB: [39.9334, 32.8597],
  ADA: [37.0017, 35.3289],
  AYT: [36.8841, 30.7056],

  // Iraq
  BGW: [33.3152, 44.3661],
  NJF: [31.9919, 44.4042],
  EBL: [36.1911, 44.0094],
  ISU: [35.5610, 45.4316],

  // Other MENA hubs
  CMN: [33.5731, -7.5898], // Casablanca
  TUN: [36.8065, 10.1815], // Tunis
  ALG: [36.7372, 3.0865],  // Algiers
  KRT: [15.5007, 32.5599], // Khartoum
}

export function getCityCoords(iata: string | null | undefined): [number, number] | null {
  if (!iata) return null
  return CITY_COORDS[iata.toUpperCase()] || null
}
