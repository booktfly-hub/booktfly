/**
 * Country dial-code data for the international phone input.
 * Ordered with GCC + MENA first (most relevant to BookitFly users), then the rest alphabetical.
 */

export interface DialCountry {
  /** ISO 3166-1 alpha-2 */
  iso: string
  /** International dial code without + */
  dial: string
  name_ar: string
  name_en: string
  /** National mobile number length (min) — used for basic validation */
  minLen: number
  /** National mobile number length (max) */
  maxLen: number
  /** Typical first digit after trunk strip — used to format */
  example?: string
}

export const PRIORITY_ISO: readonly string[] = [
  'SA', 'AE', 'KW', 'BH', 'QA', 'OM', 'EG', 'JO', 'IQ', 'YE', 'LB', 'SY', 'SD', 'MA', 'DZ', 'TN', 'LY', 'PS',
]

export const DIAL_COUNTRIES: readonly DialCountry[] = [
  { iso: 'SA', dial: '966', name_ar: 'السعودية', name_en: 'Saudi Arabia', minLen: 9, maxLen: 9, example: '5XXXXXXXX' },
  { iso: 'AE', dial: '971', name_ar: 'الإمارات', name_en: 'United Arab Emirates', minLen: 9, maxLen: 9, example: '5XXXXXXXX' },
  { iso: 'KW', dial: '965', name_ar: 'الكويت', name_en: 'Kuwait', minLen: 8, maxLen: 8 },
  { iso: 'BH', dial: '973', name_ar: 'البحرين', name_en: 'Bahrain', minLen: 8, maxLen: 8 },
  { iso: 'QA', dial: '974', name_ar: 'قطر', name_en: 'Qatar', minLen: 8, maxLen: 8 },
  { iso: 'OM', dial: '968', name_ar: 'عُمان', name_en: 'Oman', minLen: 8, maxLen: 8 },
  { iso: 'EG', dial: '20', name_ar: 'مصر', name_en: 'Egypt', minLen: 10, maxLen: 10 },
  { iso: 'JO', dial: '962', name_ar: 'الأردن', name_en: 'Jordan', minLen: 9, maxLen: 9 },
  { iso: 'IQ', dial: '964', name_ar: 'العراق', name_en: 'Iraq', minLen: 10, maxLen: 10 },
  { iso: 'YE', dial: '967', name_ar: 'اليمن', name_en: 'Yemen', minLen: 9, maxLen: 9 },
  { iso: 'LB', dial: '961', name_ar: 'لبنان', name_en: 'Lebanon', minLen: 7, maxLen: 8 },
  { iso: 'SY', dial: '963', name_ar: 'سوريا', name_en: 'Syria', minLen: 9, maxLen: 9 },
  { iso: 'SD', dial: '249', name_ar: 'السودان', name_en: 'Sudan', minLen: 9, maxLen: 9 },
  { iso: 'MA', dial: '212', name_ar: 'المغرب', name_en: 'Morocco', minLen: 9, maxLen: 9 },
  { iso: 'DZ', dial: '213', name_ar: 'الجزائر', name_en: 'Algeria', minLen: 9, maxLen: 9 },
  { iso: 'TN', dial: '216', name_ar: 'تونس', name_en: 'Tunisia', minLen: 8, maxLen: 8 },
  { iso: 'LY', dial: '218', name_ar: 'ليبيا', name_en: 'Libya', minLen: 9, maxLen: 9 },
  { iso: 'PS', dial: '970', name_ar: 'فلسطين', name_en: 'Palestine', minLen: 9, maxLen: 9 },
  { iso: 'TR', dial: '90', name_ar: 'تركيا', name_en: 'Turkey', minLen: 10, maxLen: 10 },
  { iso: 'PK', dial: '92', name_ar: 'باكستان', name_en: 'Pakistan', minLen: 10, maxLen: 10 },
  { iso: 'IN', dial: '91', name_ar: 'الهند', name_en: 'India', minLen: 10, maxLen: 10 },
  { iso: 'BD', dial: '880', name_ar: 'بنغلاديش', name_en: 'Bangladesh', minLen: 10, maxLen: 10 },
  { iso: 'PH', dial: '63', name_ar: 'الفلبين', name_en: 'Philippines', minLen: 10, maxLen: 10 },
  { iso: 'ID', dial: '62', name_ar: 'إندونيسيا', name_en: 'Indonesia', minLen: 9, maxLen: 12 },
  { iso: 'MY', dial: '60', name_ar: 'ماليزيا', name_en: 'Malaysia', minLen: 9, maxLen: 10 },
  { iso: 'GB', dial: '44', name_ar: 'المملكة المتحدة', name_en: 'United Kingdom', minLen: 10, maxLen: 10 },
  { iso: 'US', dial: '1', name_ar: 'الولايات المتحدة', name_en: 'United States', minLen: 10, maxLen: 10 },
  { iso: 'CA', dial: '1', name_ar: 'كندا', name_en: 'Canada', minLen: 10, maxLen: 10 },
  { iso: 'FR', dial: '33', name_ar: 'فرنسا', name_en: 'France', minLen: 9, maxLen: 9 },
  { iso: 'DE', dial: '49', name_ar: 'ألمانيا', name_en: 'Germany', minLen: 10, maxLen: 11 },
  { iso: 'IT', dial: '39', name_ar: 'إيطاليا', name_en: 'Italy', minLen: 9, maxLen: 10 },
  { iso: 'ES', dial: '34', name_ar: 'إسبانيا', name_en: 'Spain', minLen: 9, maxLen: 9 },
  { iso: 'NL', dial: '31', name_ar: 'هولندا', name_en: 'Netherlands', minLen: 9, maxLen: 9 },
  { iso: 'CH', dial: '41', name_ar: 'سويسرا', name_en: 'Switzerland', minLen: 9, maxLen: 9 },
  { iso: 'SE', dial: '46', name_ar: 'السويد', name_en: 'Sweden', minLen: 9, maxLen: 9 },
  { iso: 'AU', dial: '61', name_ar: 'أستراليا', name_en: 'Australia', minLen: 9, maxLen: 9 },
  { iso: 'CN', dial: '86', name_ar: 'الصين', name_en: 'China', minLen: 11, maxLen: 11 },
  { iso: 'JP', dial: '81', name_ar: 'اليابان', name_en: 'Japan', minLen: 10, maxLen: 10 },
  { iso: 'KR', dial: '82', name_ar: 'كوريا الجنوبية', name_en: 'South Korea', minLen: 9, maxLen: 10 },
  { iso: 'RU', dial: '7', name_ar: 'روسيا', name_en: 'Russia', minLen: 10, maxLen: 10 },
  { iso: 'ZA', dial: '27', name_ar: 'جنوب أفريقيا', name_en: 'South Africa', minLen: 9, maxLen: 9 },
  { iso: 'ET', dial: '251', name_ar: 'إثيوبيا', name_en: 'Ethiopia', minLen: 9, maxLen: 9 },
  { iso: 'NG', dial: '234', name_ar: 'نيجيريا', name_en: 'Nigeria', minLen: 10, maxLen: 10 },
  { iso: 'KE', dial: '254', name_ar: 'كينيا', name_en: 'Kenya', minLen: 9, maxLen: 9 },
]

export function findByIso(iso: string): DialCountry | undefined {
  return DIAL_COUNTRIES.find((c) => c.iso === iso)
}

export function findByDial(dial: string): DialCountry | undefined {
  return DIAL_COUNTRIES.find((c) => c.dial === dial)
}

/**
 * Given a raw input string, try to split it into { dial, national }.
 * Handles "+966512345678", "00966512345678", "0512345678" with an assumed country, etc.
 */
export function parseE164(raw: string, fallbackIso: string = 'SA'): { iso: string; dial: string; national: string } {
  let s = (raw || '').replace(/[\s\-()]/g, '')
  if (s.startsWith('00')) s = '+' + s.slice(2)

  if (s.startsWith('+')) {
    s = s.slice(1)
    // longest-prefix match
    for (let len = 4; len >= 1; len--) {
      const prefix = s.slice(0, len)
      const country = findByDial(prefix)
      if (country) {
        return { iso: country.iso, dial: country.dial, national: s.slice(len) }
      }
    }
  }

  // local number — strip leading 0
  if (s.startsWith('0')) s = s.slice(1)
  const fallback = findByIso(fallbackIso) ?? DIAL_COUNTRIES[0]
  return { iso: fallback.iso, dial: fallback.dial, national: s }
}

export function toE164(iso: string, national: string): string {
  const country = findByIso(iso) ?? DIAL_COUNTRIES[0]
  const stripped = national.replace(/\D/g, '').replace(/^0+/, '')
  return `+${country.dial}${stripped}`
}

export function flagEmoji(iso: string): string {
  if (!iso || iso.length !== 2) return '🏳️'
  const base = 127397
  return String.fromCodePoint(iso.charCodeAt(0) + base) + String.fromCodePoint(iso.charCodeAt(1) + base)
}
