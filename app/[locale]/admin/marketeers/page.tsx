'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import type { MarkeeteerApplication } from '@/types'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, Loader2, MessageSquare, X, Search } from 'lucide-react'
import { toast } from '@/components/ui/toaster'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function AdminMarketeers() {
  return (
    <Suspense>
      <AdminMarketeersContent />
    </Suspense>
  )
}

type AppWithProfile = MarkeeteerApplication & { profiles?: { full_name: string; email: string } | null }

function AdminMarketeersContent() {
  const t = useTranslations()
  const te = useTranslations('errors')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status') || 'pending_review'
  const [applications, setApplications] = useState<AppWithProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
  const [comment, setComment] = useState('')

  const loadApplications = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/marketeers?status=${statusFilter}`)
    const result = await res.json()
    setApplications(result.data || [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { loadApplications() }, [loadApplications])

  async function handleAction(id: string, action: 'approve' | 'reject', rejComment?: string) {
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/marketeers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: rejComment }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: resolveApiErrorMessage(result.error, te), variant: 'destructive' })
        return
      }
      toast({
        title: action === 'approve'
          ? (locale === 'ar' ? 'تمت الموافقة على المسوّق' : 'Marketeer approved')
          : (locale === 'ar' ? 'تم رفض الطلب' : 'Application rejected'),
        variant: 'success',
      })
      setRejectModal(null)
      setComment('')
      await loadApplications()
    } finally {
      setActionId(null)
    }
  }

  const statuses = ['pending_review', 'approved', 'rejected']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {locale === 'ar' ? 'طلبات المسوّقين' : 'Marketeer Applications'}
      </h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'بحث بالاسم أو رقم الجوال...' : 'Search by name or phone...'}
            className="ps-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/${locale}/admin/marketeers?status=${s}`}
            className={cn(
              buttonVariants({ variant: statusFilter === s ? 'default' : 'outline', size: 'sm' }),
              'rounded-lg',
              statusFilter === s
                ? 'shadow-sm'
                : 'bg-white hover:bg-muted'
            )}
          >
            {t(`status.${s}`)}
          </Link>
        ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg">{locale === 'ar' ? 'إدارة طلبات المسوّقين' : 'Manage Marketeer Applications'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.phone')}</TableHead>
                <TableHead>{t('common.email')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                {statusFilter === 'pending_review' && (
                  <TableHead>{t('common.actions')}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
              ) : applications.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="p-8 text-center text-muted-foreground">{t('common.no_results')}</TableCell></TableRow>
              ) : (
                applications
                .filter((app) => {
                  if (!search.trim()) return true
                  const q = search.toLowerCase()
                  return app.full_name.toLowerCase().includes(q) || app.phone.includes(q)
                })
                .map((app) => (
                  <TableRow
                    key={app.id}
                    data-testid={`marketeer-application-row-${app.id}`}
                    data-application-email={app.email}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/${locale}/admin/marketeers/${app.id}`)}
                  >
                    <TableCell className="font-medium">{app.full_name}</TableCell>
                    <TableCell className="font-mono text-xs">{app.phone}</TableCell>
                    <TableCell>{app.email}</TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          app.status === 'approved'
                            ? 'success'
                            : app.status === 'rejected'
                              ? 'destructive'
                              : 'warning'
                        }
                      >
                        {t(`status.${app.status}`)}
                      </Badge>
                    </TableCell>
                    {statusFilter === 'pending_review' && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            disabled={actionId === app.id}
                            onClick={() => handleAction(app.id, 'approve')}
                            variant="outline"
                            size="sm"
                            data-testid={`approve-marketeer-${app.id}`}
                            className="border-green-500/20 bg-green-500/10 text-green-700 hover:bg-green-500/20"
                          >
                            {actionId === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            {locale === 'ar' ? 'قبول' : 'Approve'}
                          </Button>
                          <Button
                            disabled={actionId === app.id}
                            onClick={() => setRejectModal({ id: app.id, name: app.full_name })}
                            variant="outline"
                            size="sm"
                            data-testid={`reject-marketeer-${app.id}`}
                            className="border-red-500/20 bg-red-500/10 text-red-700 hover:bg-red-500/20"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            {locale === 'ar' ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-destructive" />
                {locale === 'ar' ? 'سبب الرفض' : 'Rejection Reason'}
              </h3>
              <Button onClick={() => { setRejectModal(null); setComment('') }} variant="ghost" size="icon-sm" className="rounded-lg">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {locale === 'ar' ? `رفض طلب: ${rejectModal.name}` : `Rejecting: ${rejectModal.name}`}
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={locale === 'ar' ? 'اكتب سبب الرفض...' : 'Enter rejection reason...'}
              className="resize-none"
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => handleAction(rejectModal.id, 'reject', comment)}
                disabled={!comment.trim() || actionId === rejectModal.id}
                className="flex-1 rounded-xl text-sm font-bold"
              >
                {actionId === rejectModal.id && <Loader2 className="h-4 w-4 animate-spin" />}
                {locale === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection'}
              </Button>
              <Button
                onClick={() => { setRejectModal(null); setComment('') }}
                variant="outline"
                className="rounded-xl"
              >
                {t('common.cancel')}
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
