'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Users, Loader2 } from 'lucide-react'

type ReferredUser = { id: string; full_name: string; email: string; created_at: string }

export default function MarkeeteerUsersPage() {
  const locale = useLocale() as 'ar' | 'en' | 'tr'
  const isAr = locale === 'ar'
  const [users, setUsers] = useState<ReferredUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketeers/users', { headers: { 'Accept-Language': locale } })
      .then((r) => r.json())
      .then((res) => setUsers(res.data ?? []))
      .finally(() => setLoading(false))
  }, [locale])

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {pick(locale, 'المستخدمون المُحالون', 'Referred Users', 'Yönlendirilen Kullanıcılar')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {pick(locale, 'المستخدمون الذين سجّلوا عبر رابط إحالتك', 'Users who signed up through your referral link', 'Referans bağlantınız üzerinden kaydolan kullanıcılar')}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            {pick(locale, `الإجمالي: ${users.length}`, `Total: ${users.length}`)}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">
              {pick(locale, 'لم يسجل أحد عبر رابط الإحالة بعد', 'No one has signed up through your referral link yet', 'Henüz referans bağlantınızdan kimse kaydolmadı')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-5 p-6 hover:bg-slate-50 transition-colors">
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <span className="text-purple-600 font-black text-sm">{u.full_name?.[0]?.toUpperCase() ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{u.full_name}</p>
                  <p className="text-sm text-slate-500 truncate">{u.email}</p>
                </div>
                <p className="text-sm text-slate-400 shrink-0">
                  {new Date(u.created_at).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
