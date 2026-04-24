'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import type { User, SupabaseClient } from '@supabase/supabase-js'

type UserContextValue = {
  user: User | null
  profile: Profile | null
  loading: boolean
  supabase: SupabaseClient
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient()).current
  const router = useRouter()
  const locale = useLocale()

  const signOut = useCallback(async () => {
    setUser(null)
    setProfile(null)
    setLoading(false)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out failed:', error.message)
    }

    router.replace(`/${locale}`)
    router.refresh()
  }, [supabase, router, locale])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        if (mounted) setProfile(data)
      }
      if (mounted) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (event === 'PASSWORD_RECOVERY') {
        router.replace(`/${locale}/auth/update-password`)
        setLoading(false)
        return
      }
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        setProfile(data)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router, locale])

  return (
    <UserContext.Provider value={{ user, profile, loading, supabase, signOut }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
