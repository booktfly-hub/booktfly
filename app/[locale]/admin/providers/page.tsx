'use client'
import { lkey } from '@/lib/i18n-helpers'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { Provider } from '@/types'
import { PROVIDER_TYPES } from '@/lib/constants'
import { Eye } from 'lucide-react'

export default function AdminProviders() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter) query = query.eq('status', statusFilter)

      const { data } = await query
      setProviders(data || [])
      setLoading(false)
    }
    fetch()
  }, [statusFilter])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.providers')}</h1>

      <div className="flex gap-2 mb-6">
        {['', 'active', 'suspended'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? t(`status.${s}`) : locale === 'ar' ? 'الكل' : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{t('common.name')}</th>
                <th className="text-start p-3 font-medium">{t('common.type')}</th>
                <th className="text-start p-3 font-medium">{t('common.email')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('provider.commission_rate')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t('common.loading')}</td></tr>
              ) : providers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</td></tr>
              ) : (
                providers.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{p.company_name_ar}</td>
                    <td className="p-3">{PROVIDER_TYPES[p.provider_type][lkey(locale)]}</td>
                    <td className="p-3">{p.contact_email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        p.status === 'active' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      }`}>
                        {t(`status.${p.status}`)}
                      </span>
                    </td>
                    <td className="p-3">{p.commission_rate ? `${p.commission_rate}%` : locale === 'ar' ? 'افتراضي' : 'Default'}</td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/admin/providers/${p.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 font-medium text-primary transition-colors hover:bg-muted"
                      >
                        <Eye className="h-4 w-4" />
                        {locale === 'ar' ? 'تفاصيل' : 'Details'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
