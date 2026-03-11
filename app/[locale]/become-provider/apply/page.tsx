'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { providerApplicationSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import {
  Upload,
  Building2,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FormData = z.infer<typeof providerApplicationSchema>

const DOC_FIELDS = [
  'doc_hajj_permit',
  'doc_commercial_reg',
  'doc_tourism_permit',
  'doc_civil_aviation',
  'doc_iata_permit',
] as const

export default function ApplyProviderPage() {
  const t = useTranslations('become_provider')
  const tc = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [documents, setDocuments] = useState<Record<string, File | null>>({
    doc_hajj_permit: null,
    doc_commercial_reg: null,
    doc_tourism_permit: null,
    doc_civil_aviation: null,
    doc_iata_permit: null,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(providerApplicationSchema),
    defaultValues: {
      provider_type: 'travel_agency',
    },
  })

  const selectedType = watch('provider_type')

  function handleDocChange(field: string, file: File | null) {
    setDocuments((prev) => ({ ...prev, [field]: file }))
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true)
    try {
      const formData = new FormData()

      // Append text fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      // Append document files
      Object.entries(documents).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file)
        }
      })

      const res = await fetch('/api/providers/apply', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        toast({
          title: result.error || tc('error'),
          variant: 'destructive',
        })
        return
      }

      toast({
        title: t('application_received'),
        variant: 'success',
      })
      router.push(`/${locale}/become-provider/status`)
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t('apply_title')}</h1>
        <p className="text-muted-foreground mb-8">{t('subtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Provider Type */}
          <div className="space-y-3">
            <label className="text-sm font-medium">{t('select_type')}</label>
            <div className="grid grid-cols-2 gap-4">
              {(['travel_agency', 'hajj_umrah'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                    selectedType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('provider_type')}
                    className="sr-only"
                  />
                  <Building2
                    className={cn(
                      'h-5 w-5',
                      selectedType === type
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium text-sm',
                      selectedType === type ? 'text-primary' : ''
                    )}
                  >
                    {t(type)}
                  </span>
                </label>
              ))}
            </div>
            {errors.provider_type && (
              <p className="text-destructive text-sm">
                {errors.provider_type.message}
              </p>
            )}
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('company_info')}</h2>

            <div>
              <label className="text-sm font-medium">
                {t('doc_commercial_reg').replace(/\(.*\)/, '')} *
              </label>
              <label className="text-sm font-medium block mb-1.5">
                {locale === 'ar' ? 'اسم الشركة بالعربية' : 'Company Name (Arabic)'} *
              </label>
              <input
                {...register('company_name_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {errors.company_name_ar && (
                <p className="text-destructive text-sm mt-1">
                  {errors.company_name_ar.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                {locale === 'ar' ? 'اسم الشركة بالإنجليزية' : 'Company Name (English)'}{' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <input
                {...register('company_name_en')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                {locale === 'ar' ? 'وصف الشركة بالعربية' : 'Company Description (Arabic)'}{' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <textarea
                {...register('company_description_ar')}
                dir="rtl"
                rows={3}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1.5">
                {locale === 'ar' ? 'وصف الشركة بالإنجليزية' : 'Company Description (English)'}{' '}
                <span className="text-muted-foreground">({tc('optional')})</span>
              </label>
              <textarea
                {...register('company_description_en')}
                dir="ltr"
                rows={3}
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {tc('email')} *
                </label>
                <input
                  type="email"
                  {...register('contact_email')}
                  dir="ltr"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {errors.contact_email && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.contact_email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">
                  {tc('phone')} *
                </label>
                <input
                  type="tel"
                  {...register('contact_phone')}
                  dir="ltr"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {errors.contact_phone && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.contact_phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{t('documents')}</h2>
            <div className="space-y-3">
              {DOC_FIELDS.map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-4 p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t(field)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('optional_document')}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {documents[field] ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-xs text-muted-foreground max-w-[100px] truncate">
                          {documents[field]!.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDocChange(field, null)}
                          className="text-xs text-destructive hover:underline"
                        >
                          {tc('delete')}
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md cursor-pointer hover:bg-muted transition-colors">
                        <Upload className="h-3.5 w-3.5" />
                        {t('upload_document')}
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="sr-only"
                          onChange={(e) =>
                            handleDocChange(field, e.target.files?.[0] ?? null)
                          }
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">{t('terms')}</h2>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('terms_accepted', {
                  setValueAs: (v) => v === true || v === 'true',
                })}
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <span className="text-sm text-muted-foreground">
                {t('terms_checkbox')}
              </span>
            </label>
            {errors.terms_accepted && (
              <p className="text-destructive text-sm">
                {errors.terms_accepted.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('submit_application')}
          </button>
        </form>
      </div>
    </div>
  )
}
