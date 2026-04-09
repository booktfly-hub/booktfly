'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface HelpPageClientProps {
  locale: string
}

const faqData = {
  booking: [
    {
      q_ar: 'كيف يمكنني حجز رحلة؟',
      q_en: 'How do I book a flight?',
      a_ar: 'ابحث عن الرحلات المتاحة من الصفحة الرئيسية، اختر الرحلة المناسبة، أدخل بيانات المسافرين، ثم أتمم عملية الدفع.',
      a_en: 'Search for available flights from the homepage, select a suitable trip, enter passenger details, and complete the payment process.',
    },
    {
      q_ar: 'هل يمكنني الحجز بدون إنشاء حساب؟',
      q_en: 'Can I book without creating an account?',
      a_ar: 'نعم، يمكنك الحجز كضيف باستخدام بريدك الإلكتروني ورقم هاتفك. سيتم إرسال رابط لمتابعة حجزك.',
      a_en: 'Yes, you can book as a guest using your email and phone number. A link to track your booking will be sent to you.',
    },
  ],
  payment: [
    {
      q_ar: 'ما هي طرق الدفع المتاحة؟',
      q_en: 'What payment methods are available?',
      a_ar: 'نقبل حالياً التحويل البنكي. يمكنك رفع إيصال التحويل بعد إتمام الحجز.',
      a_en: 'We currently accept bank transfer. You can upload the transfer receipt after completing your booking.',
    },
  ],
  cancellation: [
    {
      q_ar: 'كيف يمكنني إلغاء حجزي؟',
      q_en: 'How can I cancel my booking?',
      a_ar: 'يمكنك طلب الإلغاء من صفحة تفاصيل الحجز. سيتم مراجعة طلبك من قبل المزود.',
      a_en: 'You can request cancellation from the booking details page. Your request will be reviewed by the provider.',
    },
  ],
  provider: [
    {
      q_ar: 'كيف أصبح مزود خدمة؟',
      q_en: 'How do I become a provider?',
      a_ar: 'انقر على "كن مزود خدمة" في شريط التنقل، واملأ نموذج التقديم مع المستندات المطلوبة. سيتم مراجعة طلبك من قبل فريقنا.',
      a_en: 'Click "Become a Provider" in the navigation bar, fill out the application form with required documents. Your application will be reviewed by our team.',
    },
  ],
  account: [
    {
      q_ar: 'كيف يمكنني تحديث بيانات حسابي؟',
      q_en: 'How can I update my account information?',
      a_ar: 'انتقل إلى صفحة الملف الشخصي من القائمة الرئيسية لتعديل بياناتك الشخصية.',
      a_en: 'Go to the profile page from the main menu to edit your personal information.',
    },
  ],
}

type Category = keyof typeof faqData

export function HelpPageClient({ locale }: HelpPageClientProps) {
  const t = useTranslations('help')
  const isAr = locale === 'ar'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null)

  const categories: { key: Category | 'all'; label: string }[] = [
    { key: 'all', label: isAr ? 'الكل' : 'All' },
    { key: 'booking', label: t('categories.booking') },
    { key: 'payment', label: t('categories.payment') },
    { key: 'cancellation', label: t('categories.cancellation') },
    { key: 'provider', label: t('categories.provider') },
    { key: 'account', label: t('categories.account') },
  ]

  const allFaqs = Object.entries(faqData).flatMap(([cat, items]) =>
    items.map((item, idx) => ({ ...item, category: cat as Category, key: `${cat}-${idx}` }))
  )

  const filtered = allFaqs.filter((faq) => {
    const matchesCat = selectedCategory === 'all' || faq.category === selectedCategory
    const q = isAr ? faq.q_ar : faq.q_en
    const a = isAr ? faq.a_ar : faq.a_en
    const matchesSearch = !searchQuery || q.toLowerCase().includes(searchQuery.toLowerCase()) || a.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  return (
    <div className="container max-w-3xl py-8 px-4 mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('search_placeholder')}
          className="ps-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
              selectedCategory === cat.key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/30'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t('no_results')}</p>
        ) : (
          filtered.map((faq) => (
            <div key={faq.key} className="rounded-lg border border-border">
              <button
                onClick={() => setExpandedIndex(expandedIndex === faq.key ? null : faq.key)}
                className="flex items-center justify-between w-full p-4 text-start"
              >
                <span className="font-medium text-sm">{isAr ? faq.q_ar : faq.q_en}</span>
                {expandedIndex === faq.key ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {expandedIndex === faq.key && (
                <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {isAr ? faq.a_ar : faq.a_en}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Contact support */}
      <div className="mt-10 text-center rounded-lg border border-border bg-muted/30 p-6">
        <MessageCircle className="h-6 w-6 text-primary mx-auto mb-2" />
        <p className="font-medium text-sm mb-1">{t('still_need_help')}</p>
        <a href="mailto:support@booktfly.com" className="text-sm text-primary hover:underline">
          support@booktfly.com
        </a>
      </div>
    </div>
  )
}
