'use client'

import { Heart } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSavedItems } from '@/contexts/saved-items-context'
import { useUser } from '@/contexts/user-context'
import { toast } from '@/components/ui/toaster'

interface FavoriteButtonProps {
  itemType: 'trip' | 'room' | 'car' | 'package'
  itemId: string
  className?: string
}

export function FavoriteButton({ itemType, itemId, className }: FavoriteButtonProps) {
  const { savedKeys, toggle, isLoaded } = useSavedItems()
  const { user } = useUser()
  const locale = useLocale()
  const router = useRouter()
  const isSaved = savedKeys.has(`${itemType}_${itemId}`)
  const isAr = locale === 'ar'

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      router.push(`/${locale}/auth/login`)
      return
    }

    const wasAlreadySaved = isSaved
    await toggle(itemType, itemId)
    toast({
      title: wasAlreadySaved
        ? (isAr ? 'تمت الإزالة من المحفوظات' : 'Removed from saved')
        : (isAr ? 'تم الحفظ!' : 'Saved!'),
    })
  }

  if (!isLoaded) return null

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex items-center justify-center h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-white/50',
        'hover:scale-110 active:scale-95 transition-transform duration-150',
        className
      )}
      aria-label={isSaved ? (isAr ? 'إزالة من المحفوظات' : 'Remove from saved') : (isAr ? 'حفظ' : 'Save')}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-colors duration-200',
          isSaved ? 'fill-red-500 text-red-500' : 'text-slate-500'
        )}
      />
    </button>
  )
}
