'use client'

import { pick } from '@/lib/i18n-helpers'
import { Plus, X, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { CityAutocomplete } from '@/components/shared/city-autocomplete'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type FlightLeg = {
  origin: string
  destination: string
  date?: Date
}

interface MultiCityLegsProps {
  legs: FlightLeg[]
  onChange: (legs: FlightLeg[]) => void
  locale: string
  departureFromLabel: string
  arrivalToLabel: string
  departureDateLabel: string
}

export function MultiCityLegs({ legs, onChange, locale, departureFromLabel, arrivalToLabel, departureDateLabel }: MultiCityLegsProps) {
  function addLeg() {
    if (legs.length >= 6) return
    onChange([...legs, { origin: '', destination: '', date: undefined }])
  }

  function removeLeg(index: number) {
    if (legs.length <= 2) return
    onChange(legs.filter((_, i) => i !== index))
  }

  function updateLeg(index: number, field: keyof FlightLeg, value: string | Date | undefined) {
    const updated = legs.map((leg, i) => (i === index ? { ...leg, [field]: value } : leg))
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {legs.map((leg, index) => (
        <div key={index} className="flex items-end gap-2">
          <div className="flex-1 grid grid-cols-3 gap-2">
            {/* Origin */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {departureFromLabel} {index + 1}
              </label>
              <CityAutocomplete
                value={leg.origin}
                onChange={(val) => updateLeg(index, 'origin', val)}
                placeholder={departureFromLabel}
                locale={locale}
              />
            </div>

            {/* Destination */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {arrivalToLabel} {index + 1}
              </label>
              <CityAutocomplete
                value={leg.destination}
                onChange={(val) => updateLeg(index, 'destination', val)}
                placeholder={arrivalToLabel}
                locale={locale}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {departureDateLabel}
              </label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    'flex items-center w-full justify-start text-start font-normal h-10 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted/50',
                    !leg.date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="h-4 w-4 me-2 shrink-0" />
                  {leg.date ? format(leg.date, 'dd/MM/yyyy') : departureDateLabel}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={leg.date}
                    onSelect={(date) => updateLeg(index, 'date', date)}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Remove button */}
          {legs.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeLeg(index)}
              className="text-destructive shrink-0 mb-0.5"
              aria-label={`Remove leg ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      {/* Add leg button */}
      {legs.length < 6 && (
        <Button
          variant="outline"
          size="sm"
          onClick={addLeg}
          className="gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {pick(locale, 'إضافة رحلة', 'Add Flight', 'Uçuş Ekle')}
        </Button>
      )}
    </div>
  )
}
