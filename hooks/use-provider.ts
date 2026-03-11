'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Provider } from '@/types'

export function useProvider(userId: string | undefined) {
  const [provider, setProvider] = useState<Provider | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    async function fetchProvider() {
      const { data } = await supabase
        .from('providers')
        .select('*')
        .eq('user_id', userId)
        .single()

      setProvider(data)
      setLoading(false)
    }

    fetchProvider()
  }, [userId])

  return { provider, loading }
}
