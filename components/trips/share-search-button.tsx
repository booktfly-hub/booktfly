'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Check, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pick } from '@/lib/i18n-helpers'

interface ShareSearchButtonProps {
  /** Optional title for the Web Share API; falls back to the page title. */
  title?: string
  className?: string
}

export function ShareSearchButton({ title, className }: ShareSearchButtonProps) {
  const locale = useLocale()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const shareTitle = title || document.title

    // Try the native Web Share API first (mobile sheets, system dialogs).
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: shareTitle, url })
        return
      } catch {
        // User dismissed — fall through to clipboard copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Last-resort fallback: select & copy via a hidden input.
      const tmp = document.createElement('input')
      tmp.value = url
      document.body.appendChild(tmp)
      tmp.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(tmp)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={pick(locale, 'مشاركة البحث', 'Share search', 'Aramayı paylaş')}
      className={cn(
        'inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs md:text-sm font-bold transition-colors relative',
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" />
          <span className="hidden md:inline">{pick(locale, 'تم النسخ', 'Copied', 'Kopyalandı')}</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span className="hidden md:inline">{pick(locale, 'مشاركة', 'Share', 'Paylaş')}</span>
        </>
      )}
    </button>
  )
}
