'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser } from './user-context'
import { toast } from '@/components/ui/toaster'

interface SavedItemsContextType {
  savedKeys: Set<string>
  toggle: (itemType: string, itemId: string) => Promise<void>
  isLoaded: boolean
}

const SavedItemsContext = createContext<SavedItemsContextType>({
  savedKeys: new Set(),
  toggle: async () => {},
  isLoaded: false,
})

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!user) {
      setSavedKeys(new Set())
      setIsLoaded(true)
      return
    }
    fetch('/api/saved-items')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => {
        const keys = new Set<string>(
          (data.items || []).map((i: { item_type: string; item_id: string }) => `${i.item_type}_${i.item_id}`)
        )
        setSavedKeys(keys)
        setIsLoaded(true)
      })
      .catch(() => setIsLoaded(true))
  }, [user])

  const toggle = useCallback(async (itemType: string, itemId: string) => {
    const key = `${itemType}_${itemId}`
    const wasSaved = savedKeys.has(key)

    setSavedKeys(prev => {
      const next = new Set(prev)
      if (wasSaved) next.delete(key)
      else next.add(key)
      return next
    })

    try {
      if (wasSaved) {
        await fetch(`/api/saved-items?item_type=${itemType}&item_id=${itemId}`, { method: 'DELETE' })
      } else {
        const res = await fetch('/api/saved-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_type: itemType, item_id: itemId }),
        })
        if (!res.ok && res.status !== 409) throw new Error()
      }
    } catch {
      setSavedKeys(prev => {
        const next = new Set(prev)
        if (wasSaved) next.add(key)
        else next.delete(key)
        return next
      })
    }
  }, [savedKeys])

  return (
    <SavedItemsContext.Provider value={{ savedKeys, toggle, isLoaded }}>
      {children}
    </SavedItemsContext.Provider>
  )
}

export function useSavedItems() {
  return useContext(SavedItemsContext)
}
