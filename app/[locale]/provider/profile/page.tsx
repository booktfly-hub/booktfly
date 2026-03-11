'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'
import { useProvider } from '@/hooks/use-provider'
import { toast } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import type { Provider } from '@/types'
import {
  Loader2,
  Save,
  ImageIcon,
  X,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'

type ProfileForm = {
  company_name_ar: string
  company_name_en: string
  company_description_ar: string
  company_description_en: string
  contact_email: string
  contact_phone: string
}

const DOC_BADGES = [
  { key: 'has_hajj_permit', label: 'doc_hajj_permit' },
  { key: 'has_commercial_reg', label: 'doc_commercial_reg' },
  { key: 'has_tourism_permit', label: 'doc_tourism_permit' },
  { key: 'has_civil_aviation', label: 'doc_civil_aviation' },
  { key: 'has_iata_permit', label: 'doc_iata_permit' },
] as const

export default function ProviderProfilePage() {
  const t = useTranslations('provider')
  const tb = useTranslations('become_provider')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { user } = useUser()
  const { provider, loading: providerLoading } = useProvider(user?.id)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const { register, handleSubmit, reset } = useForm<ProfileForm>()

  useEffect(() => {
    if (provider) {
      reset({
        company_name_ar: provider.company_name_ar,
        company_name_en: provider.company_name_en || '',
        company_description_ar: provider.company_description_ar || '',
        company_description_en: provider.company_description_en || '',
        contact_email: provider.contact_email,
        contact_phone: provider.contact_phone,
      })
      setLogoPreview(provider.logo_url)
    }
  }, [provider])

  function handleLogoChange(file: File | null) {
    setLogoFile(file)
    if (file) {
      setLogoPreview(URL.createObjectURL(file))
    } else {
      setLogoPreview(provider?.logo_url ?? null)
    }
  }

  async function onSubmit(data: ProfileForm) {
    if (!provider) return
    setSaving(true)
    try {
      const supabase = createClient()

      // Upload logo if changed
      let logoUrl = provider.logo_url
      if (logoFile) {
        const ext = logoFile.name.split('.').pop()
        const filePath = `logos/${provider.id}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('provider-documents')
          .upload(filePath, logoFile, { upsert: true })

        if (!uploadError) {
          const { data: publicUrl } = supabase.storage
            .from('provider-documents')
            .getPublicUrl(filePath)
          logoUrl = publicUrl.publicUrl
        }
      }

      const { error } = await supabase
        .from('providers')
        .update({
          company_name_ar: data.company_name_ar,
          company_name_en: data.company_name_en || null,
          company_description_ar: data.company_description_ar || null,
          company_description_en: data.company_description_en || null,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', provider.id)

      if (error) {
        toast({ title: tc('error'), variant: 'destructive' })
        return
      }

      toast({ title: tc('success'), variant: 'success' })
    } catch {
      toast({ title: tc('error'), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (providerLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!provider) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('profile')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{t('logo')}</h2>
          <div className="flex items-center gap-6">
            {logoPreview ? (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleLogoChange(null)}
                  className="absolute top-1 end-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 transition-colors shrink-0">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) =>
                    handleLogoChange(e.target.files?.[0] ?? null)
                  }
                />
              </label>
            )}
            <p className="text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'يفضل صورة مربعة بحجم 200x200 بيكسل'
                : 'Recommended: 200x200px square image'}
            </p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {locale === 'ar' ? 'بيانات الشركة' : 'Company Information'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {t('company_name_ar')} *
              </label>
              <input
                {...register('company_name_ar')}
                dir="rtl"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {t('company_name_en')}
              </label>
              <input
                {...register('company_name_en')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">
              {t('company_description')} ({locale === 'ar' ? 'عربي' : 'Arabic'})
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
              {t('company_description')} ({locale === 'ar' ? 'إنجليزي' : 'English'})
            </label>
            <textarea
              {...register('company_description_en')}
              dir="ltr"
              rows={3}
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">{t('contact_info')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tc('email')}
              </label>
              <input
                type="email"
                {...register('contact_email')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">
                {tc('phone')}
              </label>
              <input
                type="tel"
                {...register('contact_phone')}
                dir="ltr"
                className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Commission Rate */}
        <div className="bg-card border rounded-xl p-6">
          <h2 className="font-semibold mb-2">{t('commission_rate')}</h2>
          <p className="text-2xl font-bold text-primary">
            {provider.commission_rate ?? 10}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {locale === 'ar'
              ? 'يتم تحديد نسبة العمولة من قبل إدارة المنصة'
              : 'Commission rate is set by the platform administration'}
          </p>
        </div>

        {/* Document Badges */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">
            {locale === 'ar' ? 'المستندات' : 'Documents'}
          </h2>
          <div className="space-y-2">
            {DOC_BADGES.map(({ key, label }) => {
              const hasDoc = provider[key as keyof Provider] as boolean
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                >
                  {hasDoc ? (
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      hasDoc ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {tb(label)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {tc('save')}
        </button>
      </form>
    </div>
  )
}
