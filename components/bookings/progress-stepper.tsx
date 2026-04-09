'use client'

import { useTranslations } from 'next-intl'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressStepperProps {
  currentStep: number
  hasSeatStep?: boolean
  className?: string
}

export function ProgressStepper({ currentStep, hasSeatStep = false, className }: ProgressStepperProps) {
  const t = useTranslations('booking_flow')

  const steps = hasSeatStep
    ? [
        { label: t('step_select'), step: 1 },
        { label: t('step_details'), step: 2 },
        { label: t('step_seats'), step: 3 },
        { label: t('step_payment'), step: 4 },
        { label: t('step_confirmed'), step: 5 },
      ]
    : [
        { label: t('step_select'), step: 1 },
        { label: t('step_details'), step: 2 },
        { label: t('step_payment'), step: 3 },
        { label: t('step_confirmed'), step: 4 },
      ]

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  currentStep > s.step
                    ? 'bg-success text-white'
                    : currentStep === s.step
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > s.step ? (
                  <Check className="h-4 w-4" />
                ) : (
                  s.step
                )}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-[10px] font-medium whitespace-nowrap',
                  currentStep >= s.step ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {s.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 mt-[-16px]',
                  currentStep > s.step ? 'bg-success' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
