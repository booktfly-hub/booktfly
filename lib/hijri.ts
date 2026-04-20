/**
 * Hijri <-> Gregorian conversion
 * Uses the astronomical (Umm al-Qura-aligned) Kuwaiti algorithm — simple, dependency-free,
 * accurate to within 1 day for civil dates. Good enough for DOB + booking date selection UI.
 *
 * Reference: Fliegel / Van Flandern and common Kuwaiti-algorithm implementations.
 */

export interface HijriDate {
  year: number
  month: number // 1-12
  day: number
}

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
] as const

const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
] as const

export function gregorianToHijri(date: Date): HijriDate {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  // Julian day number
  let jd: number
  if (y > 1582 || (y === 1582 && m > 10) || (y === 1582 && m === 10 && d > 14)) {
    jd =
      Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
      Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
      Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
      d - 32075
  } else {
    jd = 367 * y - Math.floor((7 * (y + 5001 + Math.floor((m - 9) / 7))) / 4) +
      Math.floor((275 * m) / 9) + d + 1729777
  }

  const l = jd - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238)
  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29
  const month = Math.floor((24 * l3) / 709)
  const day = l3 - Math.floor((709 * month) / 24)
  const year = 30 * n + j - 30

  return { year, month, day }
}

export function hijriToGregorian(h: HijriDate): Date {
  const jd =
    Math.floor((11 * h.year + 3) / 30) +
    354 * h.year +
    30 * h.month -
    Math.floor((h.month - 1) / 2) +
    h.day +
    1948440 -
    385

  const l = jd + 68569
  const n = Math.floor((4 * l) / 146097)
  const l2 = l - Math.floor((146097 * n + 3) / 4)
  const i = Math.floor((4000 * (l2 + 1)) / 1461001)
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31
  const j = Math.floor((80 * l3) / 2447)
  const d = l3 - Math.floor((2447 * j) / 80)
  const l4 = Math.floor(j / 11)
  const m = j + 2 - 12 * l4
  const y = 100 * (n - 49) + i + l4

  return new Date(y, m - 1, d)
}

export function formatHijri(h: HijriDate, locale: 'ar' | 'en' = 'ar'): string {
  const monthName = locale === 'ar' ? HIJRI_MONTHS_AR[h.month - 1] : HIJRI_MONTHS_EN[h.month - 1]
  if (locale === 'ar') {
    return `${h.day} ${monthName} ${h.year}`
  }
  return `${h.day} ${monthName} ${h.year} AH`
}

export function hijriMonths(locale: 'ar' | 'en' = 'ar'): readonly string[] {
  return locale === 'ar' ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN
}

/** Days in a Hijri month (average; used only for DOB picker dropdown limits). */
export function hijriDaysInMonth(year: number, month: number): number {
  // Approximation: alternating 30/29, with leap adjustment
  const isLeap = ((year * 11 + 14) % 30) < 11
  if (month === 12 && isLeap) return 30
  return month % 2 === 1 ? 30 : 29
}
