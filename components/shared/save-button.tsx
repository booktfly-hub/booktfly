'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaveButtonProps {
  itemId: string
  itemType: 'trip' | 'room' | 'car' | 'package'
  className?: string
  size?: 'sm' | 'md'
}

export function SaveButton({ itemId, itemType, className, size = 'md' }: SaveButtonProps) {
  const t = useTranslations('saved')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if saved from localStorage cache
    const key = `saved_${itemType}_${itemId}`
    setSaved(localStorage.getItem(key) === '1')
  }, [itemId, itemType])

  async function toggle() {
    setLoading(true)
    const key = `saved_${itemType}_${itemId}`

    try {
      if (saved) {
        await fetch(`/api/saved-items?item_type=${itemType}&item_id=${itemId}`, {
          method: 'DELETE',
        })
        localStorage.removeItem(key)
        setSaved(false)
      } else {
        const res = await fetch('/api/saved-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: itemType, item_id: itemId }),
        })
        if (res.ok || res.status === 409) {
          localStorage.setItem(key, '1')
          setSaved(true)
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle() }}
      disabled={loading}
      className={cn(
        'rounded-full p-1.5 transition-colors',
        saved ? 'text-red-500' : 'text-slate-400 hover:text-red-400',
        className
      )}
      aria-label={saved ? t('unsave') : t('save')}
    >
      <Heart className={cn(iconSize, saved && 'fill-current')} />
    </button>
  )
}
