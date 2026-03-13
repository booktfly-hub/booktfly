'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { getProviderApplicationSchema } from '@/lib/validations'
import { toast } from '@/components/ui/toaster'
import { motion } from 'framer-motion'
import {
  Upload,
  Building2,
  FileText,
  Loader2,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type FormData = z.infer<ReturnType<typeof getProviderApplicationSchema>>

const DOC_CONFIG: Record<string, { required: Record<string, boolean> }> = {
  travel_agency: {
    required: {
      doc_commercial_reg: true,
      doc_civil_aviation: true,
      doc_hajj_permit: false,
      doc_tourism_permit: false,
      doc_iata_permit: false,
    },
  },
  hajj_umrah: {
    required: {
      doc_commercial_reg: true,
      doc_hajj_permit: true,
      doc_civil_aviation: false,
      doc_tourism_permit: false,
      doc_iata_permit: false,
    },
  },
}

const ALL_DOC_FIELDS = [
  'doc_commercial_reg',
  'doc_civil_aviation',
  'doc_hajj_permit',
  'doc_tourism_permit',
  'doc_iata_permit',
] as const

export default function ApplyProviderPage() {
  const t = useTranslations('become_provider')
  const tc = useTranslations('common')
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [isReapply, setIsReapply] = useState(false)
  const [documents, setDocuments] = useState<Record<string, File | null>>({
    doc_hajj_permit: null,
    doc_commercial_reg: null,
    doc_tourism_permit: null,
    doc_civil_aviation: null,
    doc_iata_permit: null,
  })

  useEffect(() => {
    async function checkExistingApplication() {
      try {
        const res = await fetch('/api/providers/my-application')
        if (!res.ok) {
          setPageLoading(false)
          return
        }
        const result = await res.json()
        if (result.data) {
          if (result.data.status === 'pending_review') {
            router.replace(`/${locale}/become-provider/status`)
            return
          }
          if (result.data.status === 'approved') {
            router.replace(`/${locale}/provider/dashboard`)
            return
          }
          if (result.data.status === 'rejected') {
            setIsReapply(true)
          }
        }
      } catch {
        // No existing application — first-time apply
      } finally {
        setPageLoading(false)
      }
    }
    checkExistingApplication()
  }, [locale, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(getProviderApplicationSchema(locale)),
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
      // Validate required documents based on provider type
      const requiredDocs = DOC_CONFIG[data.provider_type]?.required || {}
      const missingDocs = Object.entries(requiredDocs)
        .filter(([field, required]) => required && !documents[field])
        .map(([field]) => t(field as any))
      if (missingDocs.length > 0) {
        toast({
          title: locale === 'ar'
            ? `يرجى رفع المستندات المطلوبة: ${missingDocs.join('، ')}`
            : `Please upload required documents: ${missingDocs.join(', ')}`,
          variant: 'destructive',
        })
        setSubmitting(false)
        return
      }

      // Upload documents directly to Supabase Storage (avoids Vercel payload limit)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({ title: locale === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in', variant: 'destructive' })
        return
      }

      const docUrls: Record<string, string> = {}
      for (const [field, file] of Object.entries(documents)) {
        if (file) {
          const ext = file.name.split('.').pop() || 'pdf'
          const filePath = `${user.id}/applications/${field}_${Date.now()}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('provider-documents')
            .upload(filePath, file, { contentType: file.type, upsert: true })
          if (uploadError) {
            toast({
              title: locale === 'ar' ? `فشل رفع ${t(field as any)}` : `Failed to upload ${field}`,
              variant: 'destructive',
            })
            return
          }
          const { data: urlData } = supabase.storage
            .from('provider-documents')
            .getPublicUrl(filePath)
          docUrls[`${field}_url`] = urlData.publicUrl
        }
      }

      // Send only text data + doc URLs (no files) to the API
      const endpoint = isReapply ? '/api/providers/reapply' : '/api/providers/apply'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ...docUrls }),
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-44 pb-12 px-4 bg-muted/20 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -z-10" />

      <motion.div
        className="max-w-3xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            {isReapply
              ? (locale === 'ar' ? 'إعادة تقديم الطلب' : 'Reapply as Provider')
              : t('apply_title')}
          </h1>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
        </motion.div>

        {isReapply && (
          <motion.div variants={itemVariants} className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-center">
            <p className="text-amber-700 dark:text-amber-400 font-medium text-sm">
              {locale === 'ar'
                ? 'تم رفض طلبك السابق. يمكنك تقديم طلب جديد بمعلومات محدّثة.'
                : 'Your previous application was rejected. You can submit a new application with updated information.'}
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Section 1: Provider Type */}
          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
              <h2 className="text-xl font-semibold">{t('select_type')}</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {(['travel_agency', 'hajj_umrah'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'relative flex flex-col items-center gap-3 p-6 border-2 rounded-xl cursor-pointer transition-all duration-200',
                    selectedType === type
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                      : 'border-border/50 hover:border-primary/30 hover:bg-muted/50'
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('provider_type')}
                    className="sr-only"
                  />
                  <div className={cn(
                    "p-3 rounded-full",
                    selectedType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {type === 'travel_agency' ? <Globe className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                  </div>
                  <span
                    className={cn(
                      'font-semibold text-center',
                      selectedType === type ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {t(type)}
                  </span>
                  {selectedType === type && (
                    <div className="absolute top-4 right-4 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </label>
              ))}
            </div>
            {errors.provider_type && (
              <p className="text-destructive text-sm mt-3 flex items-center gap-1">
                <X className="h-4 w-4" /> {errors.provider_type.message}
              </p>
            )}
          </motion.div>

          {/* Section 2: Company Information */}
          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
              <h2 className="text-xl font-semibold">{t('company_info')}</h2>
            </div>

            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    {locale === 'ar' ? 'اسم الشركة بالعربية' : 'Company Name (Arabic)'} <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register('company_name_ar')}
                    dir="rtl"
                    className="w-full border-2 border-border/50 rounded-xl px-4 py-3 text-sm bg-background transition-colors focus:outline-none focus:ring-0 focus:border-primary hover:border-primary/30"
                    placeholder="أدخل اسم الشركة..."
                  />
                  {errors.company_name_ar && (
                    <p className="text-destructive text-xs mt-1.5 font-medium">{errors.company_name_ar.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">
                    {locale === 'ar' ? 'اسم الشركة بالإنجليزية' : 'Company Name (English)'}{' '}
                    <span className="text-muted-foreground font-normal">({tc('optional')})</span>
                  </label>
                  <input
                    {...register('company_name_en')}
                    dir="ltr"
                    className="w-full border-2 border-border/50 rounded-xl px-4 py-3 text-sm bg-background transition-colors focus:outline-none focus:ring-0 focus:border-primary hover:border-primary/30"
                    placeholder="Enter company name..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-semibold block mb-2">
                    {locale === 'ar' ? 'وصف الشركة بالعربية' : 'Company Description (Arabic)'}{' '}
                    <span className="text-muted-foreground font-normal">({tc('optional')})</span>
                  </label>
                  <textarea
                    {...register('company_description_ar')}
                    dir="rtl"
                    rows={4}
                    className="w-full border-2 border-border/50 rounded-xl px-4 py-3 text-sm bg-background transition-colors focus:outline-none focus:ring-0 focus:border-primary hover:border-primary/30 resize-none"
                    placeholder="نبذة عن الشركة..."
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2">
                    {locale === 'ar' ? 'وصف الشركة بالإنجليزية' : 'Company Description (English)'}{' '}
                    <span className="text-muted-foreground font-normal">({tc('optional')})</span>
                  </label>
                  <textarea
                    {...register('company_description_en')}
                    dir="ltr"
                    rows={4}
                    className="w-full border-2 border-border/50 rounded-xl px-4 py-3 text-sm bg-background transition-colors focus:outline-none focus:ring-0 focus:border-primary hover:border-primary/30 resize-none"
                    placeholder="Company overview..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 pt-2">
                <div>
                  <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" /> {tc('email')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('contact_email')}
                    dir="ltr"
                    className="w-full border-2 border-border/50 rounded-xl px-4 py-3 text-sm bg-background transition-colors focus:outline-none focus:ring-0 focus:border-primary hover:border-primary/30"
                    placeholder="contact@company.com"
                  />
                  {errors.contact_email && (
                    <p className="text-destructive text-xs mt-1.5 font-medium">{errors.contact_email.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" /> {tc('phone')} <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('contact_phone')}
                    dir="ltr"
                    className="w-full border-2 border-border/50 rounded-xl px-4 py-3 text-sm bg-background transition-colors focus:outline-none focus:ring-0 focus:border-primary hover:border-primary/30"
                    placeholder="+1234567890"
                  />
                  {errors.contact_phone && (
                    <p className="text-destructive text-xs mt-1.5 font-medium">{errors.contact_phone.message}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Documents */}
          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
              <h2 className="text-xl font-semibold">{t('documents')}</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6 ms-13">
              {locale === 'ar'
                ? 'يرجى رفع نسخ واضحة من مستنداتك الرسمية بصيغة PDF أو JPG أو PNG. الحد الأقصى 5 ميجابايت لكل ملف.'
                : 'Please upload clear, legible copies of your official documents in PDF, JPG, or PNG format. Max size 5MB per file.'}
            </p>

            <div className="grid gap-4">
              {ALL_DOC_FIELDS.map((field) => {
                const isUploaded = !!documents[field];
                const docConfig = DOC_CONFIG[selectedType]?.required || {}
                const isRequired = docConfig[field] === true
                return (
                  <div
                    key={field}
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-2 rounded-xl transition-all",
                      isUploaded ? "border-success/30 bg-success/5" : isRequired ? "border-border hover:border-primary/30" : "border-border/50 hover:border-border"
                    )}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        isUploaded ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
                      )}>
                        {isUploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isUploaded ? "text-success-foreground" : ""
                        )}>
                          {t(field)}
                          {isRequired
                            ? <span className="text-destructive ms-1">*</span>
                            : <span className="text-muted-foreground font-normal ms-1">({tc('optional')})</span>
                          }
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 sm:ms-auto">
                      {isUploaded ? (
                        <div className="flex items-center gap-3 bg-background border px-3 py-1.5 rounded-lg shadow-sm">
                          <span className="text-xs font-medium max-w-[120px] truncate" title={documents[field]!.name}>
                            {documents[field]!.name}
                          </span>
                          <div className="w-px h-4 bg-border" />
                          <button
                            type="button"
                            onClick={() => handleDocChange(field, null)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
                            title={tc('delete')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all text-primary">
                          <Upload className="h-4 w-4" />
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
                )
              })}
            </div>
          </motion.div>

          {/* Section 4: Terms & Submit */}
          <motion.div variants={itemVariants} className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold mb-1">{t('terms')}</h3>
                <label className="flex items-start gap-3 cursor-pointer group mt-2">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      {...register('terms_accepted', {
                        setValueAs: (v) => v === true || v === 'true',
                      })}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-muted-foreground/30 checked:border-primary checked:bg-primary transition-all"
                    />
                    <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                    {t('terms_checkbox')}
                  </span>
                </label>
                {errors.terms_accepted && (
                  <p className="text-destructive text-sm mt-2 font-medium">
                    {errors.terms_accepted.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-primary text-primary-foreground rounded-xl text-lg font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {locale === 'ar' ? 'جاري معالجة الطلب...' : 'Processing Application...'}
                </>
              ) : (
                <>
                  {t('submit_application')}
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1 rtl:-scale-x-100" />
                </>
              )}
            </button>
          </motion.div>

        </form>
      </motion.div>
    </div>
  )
}
