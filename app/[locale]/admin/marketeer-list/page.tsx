'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Marketeer } from '@/types'
import { Search } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export default function AdminMarketeersListPage() {
  return (
    <Suspense>
      <AdminMarketeersListContent />
    </Suspense>
  )
}

function AdminMarketeersListContent() {
  const locale = useLocale()
  const t = useTranslations()
  const [marketeers, setMarketeers] = useState<Marketeer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const load = useCallback(async () => {
    setLoading(true)
    const params = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''
    const res = await fetch(`/api/admin/marketeer-list${params}`)
    const result = await res.json()
    setMarketeers(result.data || [])
    setLoading(false)
  }, [debouncedSearch])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {locale === 'ar' ? 'المسوّقون' : 'Marketeers'}
      </h1>

      <div className="relative max-w-xs mb-6">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === 'ar' ? 'بحث بالاسم أو رقم الجوال...' : 'Search by name or phone...'}
          className="ps-9"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg">{locale === 'ar' ? 'قائمة المسوّقين' : 'Marketeers List'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.phone')}</TableHead>
                <TableHead>{locale === 'ar' ? 'رمز الإحالة' : 'Referral Code'}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
              ) : marketeers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</TableCell></TableRow>
              ) : (
                marketeers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.full_name}</TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">{m.phone}</TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">{m.referral_code}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === 'active' ? 'success' : 'destructive'}>
                        {m.status === 'active'
                          ? (locale === 'ar' ? 'نشط' : 'Active')
                          : (locale === 'ar' ? 'موقوف' : 'Suspended')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(m.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
