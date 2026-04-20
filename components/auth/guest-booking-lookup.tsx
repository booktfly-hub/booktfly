'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Lookup form shown on /my-bookings when signed-out.
 * User submits email + booking reference (or guest token) → redirects to the guest view.
 */
export function GuestBookingLookup({ className }: { className?: string }) {
  const t = useTranslations('guest_lookup')
  const router = useRouter()
  const locale = useLocale()

  const [email, setEmail] = useState('')
  const [ref, setRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    const trimmedRef = ref.trim()
    if (!trimmedEmail || !trimmedRef) {
      setError(t('fill_both'))
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ email: trimmedEmail, reference: trimmedRef })
      const res = await fetch(`/api/bookings/guest-lookup?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || t('not_found'))
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.token) {
        router.push(`/${locale}/guest/booking/${data.token}`)
      } else {
        setError(t('not_found'))
        setLoading(false)
      }
    } catch {
      setError(t('generic_error'))
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-sm max-w-lg mx-auto space-y-4',
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-bold">{t('title')}</h2>
        <p className="text-xs text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="guest-email" className="text-xs font-semibold block mb-1">
            {t('email_label')}
          </label>
          <Input
            id="guest-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email_placeholder')}
          />
        </div>

        <div>
          <label htmlFor="guest-ref" className="text-xs font-semibold block mb-1">
            {t('ref_label')}
          </label>
          <Input
            id="guest-ref"
            required
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder={t('ref_placeholder')}
          />
          <p className="text-[10px] text-muted-foreground mt-1">{t('ref_hint')}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 p-2.5 text-xs">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        <Search className="h-4 w-4 me-1.5" />
        {loading ? t('searching') : t('find_booking')}
      </Button>
    </form>
  )
}
