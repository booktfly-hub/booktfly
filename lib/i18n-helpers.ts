export function pick(locale: string, ar: string, en: string, tr?: string): string {
  if (locale === 'ar') return ar
  if (locale === 'tr') return tr ?? en
  return en
}

/**
 * Narrow a locale string to 'ar' | 'en' for safe indexing into
 * legacy lookup objects that only have ar/en keys. Turkish falls back to en.
 */
export const lkey = (locale: string): 'ar' | 'en' => (locale === 'ar' ? 'ar' : 'en')
