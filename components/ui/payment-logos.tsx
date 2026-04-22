'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

const logos = {
  mada: {
    src: '/payment-logos/mada.svg',
    alt: 'mada',
    width: 128,
    height: 40,
    className: 'h-5 w-auto',
  },
  applePay: {
    src: '/payment-logos/apple-pay.svg',
    alt: 'Apple Pay',
    width: 136,
    height: 40,
    className: 'h-5 w-auto',
  },
  visa: {
    src: '/payment-logos/visa.svg',
    alt: 'Visa',
    width: 128,
    height: 40,
    className: 'h-5 w-auto',
  },
  mastercard: {
    src: '/payment-logos/mastercard.svg',
    alt: 'Mastercard',
    width: 128,
    height: 40,
    className: 'h-5 w-auto',
  },
  stcPay: {
    src: '/payment-logos/stc-pay.svg',
    alt: 'stc pay',
    width: 128,
    height: 40,
    className: 'h-5 w-auto',
  },
} as const

/** Mada (Saudi debit network) logo */
export function MadaLogo({ className }: LogoProps) {
  return (
    <div className={cn('inline-flex h-6 items-center justify-center rounded-md bg-white px-2 border border-slate-200 shadow-sm', className)} aria-label="mada">
      <img src={logos.mada.src} alt={logos.mada.alt} width={logos.mada.width} height={logos.mada.height} className={logos.mada.className} loading="lazy" decoding="async" />
    </div>
  )
}

/** Apple Pay logo */
export function ApplePayLogo({ className }: LogoProps) {
  return (
    <div className={cn('inline-flex h-6 items-center justify-center rounded-md bg-black px-2 shadow-sm', className)} aria-label="Apple Pay">
      <img src={logos.applePay.src} alt={logos.applePay.alt} width={logos.applePay.width} height={logos.applePay.height} className={logos.applePay.className} loading="lazy" decoding="async" />
    </div>
  )
}

/** Visa logo */
export function VisaLogo({ className }: LogoProps) {
  return (
    <div className={cn('inline-flex h-6 items-center justify-center rounded-md bg-white px-2 border border-slate-200 shadow-sm', className)} aria-label="Visa">
      <img src={logos.visa.src} alt={logos.visa.alt} width={logos.visa.width} height={logos.visa.height} className={logos.visa.className} loading="lazy" decoding="async" />
    </div>
  )
}

/** Mastercard logo */
export function MastercardLogo({ className }: LogoProps) {
  return (
    <div className={cn('inline-flex h-6 items-center justify-center rounded-md bg-white px-2 border border-slate-200 shadow-sm', className)} aria-label="Mastercard">
      <img src={logos.mastercard.src} alt={logos.mastercard.alt} width={logos.mastercard.width} height={logos.mastercard.height} className={logos.mastercard.className} loading="lazy" decoding="async" />
    </div>
  )
}

/** STC Pay logo */
export function StcPayLogo({ className }: LogoProps) {
  return (
    <div className={cn('inline-flex h-6 items-center justify-center rounded-md bg-[#4f008c] px-2 shadow-sm', className)} aria-label="STC Pay">
      <img src={logos.stcPay.src} alt={logos.stcPay.alt} width={logos.stcPay.width} height={logos.stcPay.height} className={logos.stcPay.className} loading="lazy" decoding="async" />
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
