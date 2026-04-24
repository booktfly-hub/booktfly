'use client'

import { pick } from '@/lib/i18n-helpers'
import { Share2 } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'

type ShareButtonProps = {
  url: string
  title: string
  text?: string
  className?: string
  variant?: 'icon' | 'pill'
}

export function ShareButton({ url, title, text, className, variant = 'icon' }: ShareButtonProps) {
  const locale = useLocale()
  const isAr = locale === 'ar'

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const absoluteUrl = url.startsWith('http')
      ? url
      : `${typeof window !== 'undefined' ? window.location.origin : ''}${url}`

    const shareData = { title, text: text || title, url: absoluteUrl }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
      }
    }

    const wa = `https://wa.me/?text=${encodeURIComponent(`${text || title}\n${absoluteUrl}`)}`
    window.open(wa, '_blank', 'noopener,noreferrer')
    try {
      await navigator.clipboard.writeText(absoluteUrl)
      toast({ title: pick(locale, 'تم نسخ الرابط', 'Link copied', 'Bağlantı kopyalandı'), variant: 'success' })
    } catch {}
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted transition-colors',
          className
        )}
      >
        <Share2 className="h-4 w-4" />
        {pick(locale, 'مشاركة', 'Share', 'Paylaş')}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={pick(locale, 'مشاركة', 'Share', 'Paylaş')}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 backdrop-blur border border-border text-slate-600 hover:text-primary hover:border-primary/30 shadow-sm transition-colors',
        className
      )}
    >
      <Share2 className="h-4 w-4" />
    </button>
  )
}
