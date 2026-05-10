'use client'

import { pick, lkey } from '@/lib/i18n-helpers'
import { useState, useRef, useEffect } from 'react'
import { Users, Minus, Plus, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PassengerCounts = {
  adults: number
  children: number
  infants: number
  childAges: number[]
}

export type CabinClassValue = '' | 'economy' | 'business' | 'first'

interface PassengerPickerProps {
  value: PassengerCounts
  onChange: (value: PassengerCounts) => void
  locale: string
  className?: string
  cabinClass?: CabinClassValue
  onCabinChange?: (value: CabinClassValue) => void
}

const t = {
  ar: {
    passengers: 'المسافرون',
    adults: 'بالغون',
    adults_desc: '16 سنة فأكثر',
    children: 'أطفال',
    children_desc: 'من 1 إلى 15 سنة',
    infants: 'رضّع',
    infants_desc: 'أقل من سنة',
    child_age: 'عمر الطفل',
    years: 'سنة',
    done: 'تم',
    traveler: 'مسافر',
    travelers: 'مسافرين',
    cabin_class: 'درجة المقصورة',
    economy: 'الاقتصادية',
    business: 'رجال الأعمال',
    first: 'الأولى',
  },
  en: {
    passengers: 'Passengers',
    adults: 'Adults',
    adults_desc: 'Age 16+',
    children: 'Children',
    children_desc: 'Age 1–15',
    infants: 'Infants',
    infants_desc: 'Under 1',
    child_age: 'Child age',
    years: 'yrs',
    done: 'Done',
    traveler: 'traveler',
    travelers: 'travelers',
    cabin_class: 'Cabin class',
    economy: 'Economy',
    business: 'Business',
    first: 'First',
  },
}

export function PassengerPicker({ value, onChange, locale, className, cabinClass, onCabinChange }: PassengerPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isAr = locale === 'ar'
  const strings = t[lkey(locale)]

  const total = value.adults + value.children + value.infants

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function update(field: 'adults' | 'children' | 'infants', delta: number) {
    const next = { ...value }
    next[field] = Math.max(field === 'adults' ? 1 : 0, next[field] + delta)

    // Cap total at 9
    if (next.adults + next.children + next.infants > 9) return

    // Infants can't exceed adults
    if (field === 'infants' && next.infants > next.adults) return

    // Adjust childAges array
    if (field === 'children') {
      if (delta > 0) {
        next.childAges = [...next.childAges, 5]
      } else if (delta < 0 && next.childAges.length > next.children) {
        next.childAges = next.childAges.slice(0, next.children)
      }
    }

    onChange(next)
  }

  function setChildAge(index: number, age: number) {
    const ages = [...value.childAges]
    ages[index] = age
    onChange({ ...value, childAges: ages })
  }

  const cabinLabel: Record<Exclude<CabinClassValue, ''>, string> = {
    economy: strings.economy,
    business: strings.business,
    first: strings.first,
  }
  const travelerSummary = total === 1
    ? `1 ${strings.traveler}`
    : `${total} ${strings.travelers}`
  const summary = onCabinChange
    ? `${travelerSummary} · ${cabinClass ? cabinLabel[cabinClass] : strings.economy}`
    : travelerSummary

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full h-14 ps-14 pe-5 rounded-[1.25rem] bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none hover:bg-white transition-all shadow-sm flex items-center justify-between text-start"
      >
        <Users className="pointer-events-none absolute start-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <span>{summary}</span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 inset-x-0 z-50 rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4 animate-fade-in-up" style={{ animationDuration: '200ms' }}>
          {/* Adults */}
          <CounterRow
            label={strings.adults}
            description={strings.adults_desc}
            value={value.adults}
            onDecrement={() => update('adults', -1)}
            onIncrement={() => update('adults', 1)}
            min={1}
          />

          <div className="border-t border-slate-100" />

          {/* Children */}
          <CounterRow
            label={strings.children}
            description={strings.children_desc}
            value={value.children}
            onDecrement={() => update('children', -1)}
            onIncrement={() => update('children', 1)}
            min={0}
          />

          {/* Child age selectors */}
          {value.children > 0 && (
            <div className="ps-2 space-y-2">
              {value.childAges.map((age, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 min-w-[70px]">
                    {strings.child_age} {i + 1}
                  </span>
                  <select
                    value={age}
                    onChange={(e) => setChildAge(i, Number(e.target.value))}
                    className="flex-1 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    {Array.from({ length: 15 }, (_, a) => a + 1).map((a) => (
                      <option key={a} value={a}>
                        {a} {strings.years}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100" />

          {/* Infants */}
          <CounterRow
            label={strings.infants}
            description={strings.infants_desc}
            value={value.infants}
            onDecrement={() => update('infants', -1)}
            onIncrement={() => update('infants', 1)}
            min={0}
          />

          {/* Cabin class */}
          {onCabinChange && (
            <>
              <div className="border-t border-slate-100" />
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">{strings.cabin_class}</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['economy', 'business', 'first'] as const).map((c) => {
                    const active = (cabinClass || 'economy') === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onCabinChange(c)}
                        aria-pressed={active}
                        className={cn(
                          'h-10 rounded-lg border text-xs font-bold transition-colors',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                        )}
                      >
                        {cabinLabel[c]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Done button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full h-10 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            {strings.done}
          </button>
        </div>
      )}
    </div>
  )
}

function CounterRow({
  label,
  description,
  value,
  onDecrement,
  onIncrement,
  min = 0,
}: {
  label: string
  description: string
  value: number
  onDecrement: () => void
  onIncrement: () => void
  min?: number
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          className="h-8 w-8 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
