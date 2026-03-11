'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { APPLICATION_STATUS_COLORS } from '@/lib/constants'
import type { ProviderApplication } from '@/types'
import { Eye } from 'lucide-react'

export default function AdminApplications() {
  const t = useTranslations()
  const locale = useLocale()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || ''
  const [applications, setApplications] = useState<ProviderApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('provider_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }

      const { data } = await query
      setApplications(data || [])
      setLoading(false)
    }
    fetch()
  }, [statusFilter])

  const statuses = ['', 'pending_review', 'approved', 'rejected']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('admin.applications')}</h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/${locale}/admin/applications${s ? `?status=${s}` : ''}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-white hover:bg-muted border-border'
            }`}
          >
            {s ? t(`status.${s}`) : locale === 'ar' ? 'الكل' : 'All'}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-3 font-medium">{t('common.name')}</th>
                <th className="text-start p-3 font-medium">{t('common.type')}</th>
                <th className="text-start p-3 font-medium">{t('common.email')}</th>
                <th className="text-start p-3 font-medium">{t('common.date')}</th>
                <th className="text-start p-3 font-medium">{t('common.status')}</th>
                <th className="text-start p-3 font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t('common.no_results')}
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{app.company_name_ar}</td>
                    <td className="p-3">{t(`become_provider.${app.provider_type}`)}</td>
                    <td className="p-3">{app.contact_email}</td>
                    <td className="p-3">
                      {new Date(app.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}>
                        {t(`status.${app.status}`)}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1 text-accent hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        {t('admin.review')}
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
