'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveApiErrorMessage } from '@/lib/api-error'
import { toast } from '@/components/ui/toaster'
import { Loader2, Send, Mail } from 'lucide-react'

export default function MarketeerCampaignsPage() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const te = useTranslations('errors')
  const [sending, setSending] = useState(false)

  const [form, setForm] = useState({
    subject: '',
    listingType: 'flight' as 'flight' | 'room' | 'car',
    title: '',
    subtitle: '',
    departureOrDate: '',
    originalPrice: '',
    discountedPrice: '',
    discountPercent: '',
    hoursLeft: '24',
    bookingUrl: '',
  })

  async function handleSend() {
    if (!form.subject || !form.title || !form.bookingUrl) {
      toast({ title: te('campaign_required_fields'), variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/marketeers/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          originalPrice: Number(form.originalPrice) || 0,
          discountedPrice: Number(form.discountedPrice) || 0,
          discountPercent: Number(form.discountPercent) || 0,
          hoursLeft: Number(form.hoursLeft) || 24,
          locale,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: isAr
            ? `تم الإرسال! ${data.sent} رسالة ناجحة من ${data.total}`
            : `Sent! ${data.sent} of ${data.total} emails delivered`,
          variant: 'success',
        })
      } else {
        toast({ title: resolveApiErrorMessage(data.error, te), variant: 'destructive' })
      }
    } catch {
      toast({ title: te('network_error'), variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }))

  return (
    <div className="space-y-8 max-w-2xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          {isAr ? 'حملات البريد الإلكتروني' : 'Email Campaigns'}
        </h1>
        <p className="text-slate-500 font-medium">
          {isAr ? 'أرسل عروض اللحظة الأخيرة لعملائك' : 'Send last-minute deals to your customers'}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <Mail className="h-5 w-5 text-blue-600 shrink-0" />
          <p className="text-sm text-blue-700 font-medium">
            {isAr
              ? 'سيتم إرسال البريد إلى جميع العملاء الذين لديهم بريد إلكتروني في قائمتك'
              : 'Email will be sent to all customers with email addresses in your list'}
          </p>
        </div>

        {/* Email Subject */}
        <div>
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
            {isAr ? 'موضوع البريد' : 'Email Subject'} *
          </label>
          <input
            value={form.subject}
            onChange={(e) => update('subject', e.target.value)}
            placeholder={isAr ? 'عرض خاص: رحلة إلى جدة بخصم 30%!' : 'Special offer: Flight to Jeddah 30% off!'}
            className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Listing Type */}
        <div>
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
            {isAr ? 'نوع العرض' : 'Deal Type'}
          </label>
          <div className="flex gap-3">
            {(['flight', 'room', 'car'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => update('listingType', type)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  form.listingType === type
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'flight' ? (isAr ? 'رحلة' : 'Flight') : type === 'room' ? (isAr ? 'فندق' : 'Room') : (isAr ? 'سيارة' : 'Car')}
              </button>
            ))}
          </div>
        </div>

        {/* Deal Title & Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
              {isAr ? 'عنوان العرض' : 'Deal Title'} *
            </label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder={isAr ? 'الرياض → جدة' : 'Riyadh → Jeddah'}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
              {isAr ? 'تفاصيل إضافية' : 'Subtitle'}
            </label>
            <input
              value={form.subtitle}
              onChange={(e) => update('subtitle', e.target.value)}
              placeholder={isAr ? 'الخطوط السعودية' : 'Saudi Airlines'}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Date & Hours Left */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
              {isAr ? 'التاريخ' : 'Date'}
            </label>
            <input
              type="date"
              value={form.departureOrDate}
              onChange={(e) => update('departureOrDate', e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
              {isAr ? 'ساعات متبقية' : 'Hours Left'}
            </label>
            <input
              type="number"
              min={1}
              max={72}
              value={form.hoursLeft}
              onChange={(e) => update('hoursLeft', e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
              {isAr ? 'السعر الأصلي' : 'Original Price'}
            </label>
            <input
              type="number"
              min={0}
              value={form.originalPrice}
              onChange={(e) => update('originalPrice', e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
              {isAr ? 'سعر العرض' : 'Discounted Price'}
            </label>
            <input
              type="number"
              min={0}
              value={form.discountedPrice}
              onChange={(e) => update('discountedPrice', e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
              {isAr ? 'نسبة الخصم %' : 'Discount %'}
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.discountPercent}
              onChange={(e) => update('discountPercent', e.target.value)}
              className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Booking URL */}
        <div>
          <label className="text-sm font-bold text-slate-500 uppercase tracking-widest block mb-2">
            {isAr ? 'رابط الحجز' : 'Booking URL'} *
          </label>
          <input
            value={form.bookingUrl}
            onChange={(e) => update('bookingUrl', e.target.value)}
            dir="ltr"
            placeholder="https://booktfly.com/ar/trips/..."
            className="w-full border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-base hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {sending ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال الحملة' : 'Send Campaign')}
        </button>
      </div>
    </div>
  )
}
