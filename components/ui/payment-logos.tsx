'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

/** Mada (Saudi debit network) logo */
export function MadaLogo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        'inline-flex h-6 items-center justify-center rounded-md bg-white px-2 border border-slate-200 shadow-sm',
        className,
      )}
      aria-label="mada"
    >
      <svg viewBox="0 0 60 24" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
        <g fontFamily="Arial, sans-serif" fontWeight="bold">
          <text x="2" y="16" fontSize="10" fill="#00a650">m</text>
          <text x="12" y="16" fontSize="10" fill="#00a650">a</text>
          <text x="22" y="16" fontSize="10" fill="#231f20">d</text>
          <text x="32" y="16" fontSize="10" fill="#231f20">a</text>
          <text x="44" y="11" fontSize="6" fill="#ed1c24">م</text>
          <text x="44" y="18" fontSize="6" fill="#ed1c24">دى</text>
        </g>
      </svg>
    </div>
  )
}

/** Apple Pay logo */
export function ApplePayLogo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        'inline-flex h-6 items-center justify-center rounded-md bg-black px-2 shadow-sm',
        className,
      )}
      aria-label="Apple Pay"
    >
      <svg viewBox="0 0 50 20" className="h-3 w-auto" xmlns="http://www.w3.org/2000/svg">
        <g fill="#ffffff">
          <path d="M9.5 3c-.3 1 .1 2 .7 2.6.6.6 1.6 1 2.4.9.3-1 0-2-.7-2.6-.6-.6-1.6-1-2.4-.9zM11.5 7.4c-1 0-1.8.4-2.3.4-.5 0-1.2-.4-2-.4-1 0-2 .6-2.5 1.6-1.1 1.9-.3 4.7.8 6.2.5.8 1.1 1.6 1.9 1.6.8 0 1-.5 2-.5s1.2.5 2 .5c.8 0 1.4-.8 1.9-1.5.6-.9.9-1.8.9-1.8s-1.7-.7-1.7-2.6c0-1.6 1.3-2.4 1.4-2.4-.8-1.1-2-1.2-2.4-1.1z"/>
          <text x="17" y="14" fontFamily="Arial, sans-serif" fontSize="7" fontWeight="bold">Pay</text>
        </g>
      </svg>
    </div>
  )
}

/** Visa logo */
export function VisaLogo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        'inline-flex h-6 items-center justify-center rounded-md bg-white px-2 border border-slate-200 shadow-sm',
        className,
      )}
      aria-label="Visa"
    >
      <svg viewBox="0 0 50 16" className="h-3 w-auto" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="12" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" fontStyle="italic" fill="#1a1f71">VISA</text>
      </svg>
    </div>
  )
}

/** Mastercard logo */
export function MastercardLogo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        'inline-flex h-6 items-center justify-center rounded-md bg-white px-2 border border-slate-200 shadow-sm',
        className,
      )}
      aria-label="Mastercard"
    >
      <svg viewBox="0 0 30 18" className="h-4 w-auto" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="9" r="6" fill="#eb001b" />
        <circle cx="19" cy="9" r="6" fill="#f79e1b" />
        <path d="M15 4.2a6 6 0 010 9.6 6 6 0 010-9.6z" fill="#ff5f00" />
      </svg>
    </div>
  )
}

/** STC Pay logo */
export function StcPayLogo({ className }: LogoProps) {
  return (
    <div
      className={cn(
        'inline-flex h-6 items-center justify-center rounded-md bg-[#4f008c] px-2 shadow-sm',
        className,
      )}
      aria-label="STC Pay"
    >
      <svg viewBox="0 0 50 16" className="h-3 w-auto" xmlns="http://www.w3.org/2000/svg">
        <text x="2" y="12" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" fill="#ffffff">stc pay</text>
      </svg>
    </div>
  )
}

/** Payments row — shown in trust bars and footers */
export function PaymentLogosRow({ className, dense = false }: { className?: string; dense?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center', dense ? 'gap-1' : 'gap-2', className)}>
      <MadaLogo />
      <ApplePayLogo />
      <VisaLogo />
      <MastercardLogo />
      <StcPayLogo />
    </div>
  )
}
