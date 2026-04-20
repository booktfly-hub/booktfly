'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DIAL_COUNTRIES,
  PRIORITY_ISO,
  findByIso,
  flagEmoji,
  parseE164,
  toE164,
  type DialCountry,
} from '@/lib/countries-dial'

interface PhoneInputProps {
  value?: string | null
  onChange: (e164: string) => void
  defaultIso?: string // initial country if value empty
  className?: string
  inputClassName?: string
  disabled?: boolean
  placeholder?: string
  name?: string
  id?: string
  required?: boolean
  error?: boolean
  autoFocus?: boolean
}

export function PhoneInput({
  value,
  onChange,
  defaultIso,
  className,
  inputClassName,
  disabled,
  placeholder,
  name,
  id,
  required,
  error,
  autoFocus,
}: PhoneInputProps) {
  const t = useTranslations('phone_input')
  const locale = useLocale()
  const isAr = locale === 'ar'

  // Determine initial country from value or locale
  const initial = useMemo(() => {
    if (value) return parseE164(value, defaultIso ?? (isAr ? 'SA' : 'SA'))
    const fallback = findByIso(defaultIso ?? 'SA') ?? DIAL_COUNTRIES[0]
    return { iso: fallback.iso, dial: fallback.dial, national: '' }
  }, [value, defaultIso, isAr])

  const [iso, setIso] = useState(initial.iso)
  const [national, setNational] = useState(initial.national)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  // Keep internal in sync if parent value changes externally
  useEffect(() => {
    if (value) {
      const parsed = parseE164(value, iso)
      setIso(parsed.iso)
      setNational(parsed.national)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Click outside to close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const country = findByIso(iso) ?? DIAL_COUNTRIES[0]

  function emit(nextIso: string, nextNational: string) {
    onChange(toE164(nextIso, nextNational))
  }

  function pickCountry(c: DialCountry) {
    setIso(c.iso)
    setOpen(false)
    setQuery('')
    emit(c.iso, national)
  }

  function onNationalChange(raw: string) {
    // allow digits only
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '')
    setNational(digits)
    emit(iso, digits)
  }

  const sortedCountries = useMemo(() => {
    const priority = PRIORITY_ISO
      .map((code) => DIAL_COUNTRIES.find((c) => c.iso === code))
      .filter((c): c is DialCountry => Boolean(c))
    const rest = DIAL_COUNTRIES.filter((c) => !PRIORITY_ISO.includes(c.iso))
      .sort((a, b) => (isAr ? a.name_ar.localeCompare(b.name_ar) : a.name_en.localeCompare(b.name_en)))
    return [...priority, ...rest]
  }, [isAr])

  const filtered = useMemo(() => {
    if (!query) return sortedCountries
    const q = query.toLowerCase().trim()
    return sortedCountries.filter(
      (c) =>
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.name_ar.includes(q) ||
        c.name_en.toLowerCase().includes(q),
    )
  }, [query, sortedCountries])

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-stretch rounded-md border bg-background transition-colors',
          error ? 'border-destructive' : 'border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary',
          disabled && 'opacity-60 pointer-events-none',
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-1 px-2.5 text-sm font-medium border-e border-input hover:bg-muted transition-colors',
            isAr ? 'rounded-r-md' : 'rounded-l-md',
          )}
          aria-label={t('pick_country')}
          aria-expanded={open}
        >
          <span className="text-lg leading-none">{flagEmoji(country.iso)}</span>
          <span dir="ltr" className="text-xs text-muted-foreground">+{country.dial}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>

        <input
          type="tel"
          inputMode="tel"
          dir="ltr"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={national}
          placeholder={placeholder ?? country.example ?? '5XXXXXXXX'}
          onChange={(e) => onNationalChange(e.target.value)}
          className={cn(
            'flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground',
            inputClassName,
          )}
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[280px] rounded-md border border-border bg-popover shadow-lg max-h-72 overflow-hidden flex flex-col">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute start-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search_country')}
                className="w-full rounded-md border border-input bg-background ps-7 pe-2 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.iso}
                type="button"
                onClick={() => pickCountry(c)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-muted text-start',
                  c.iso === iso && 'bg-muted font-medium',
                )}
              >
                <span className="text-base">{flagEmoji(c.iso)}</span>
                <span className="flex-1 truncate">{isAr ? c.name_ar : c.name_en}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">+{c.dial}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">{t('no_matches')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
