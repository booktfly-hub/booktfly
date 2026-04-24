'use client'

import { pick } from '@/lib/i18n-helpers'
import { useLocale } from 'next-intl'
import { MessageSquare } from 'lucide-react'

export default function MarkeeteerChatPage() {
  const locale = useLocale() as 'ar' | 'en' | 'tr'
  const isAr = locale === 'ar'

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {pick(locale, 'المحادثات', 'Chat', 'Sohbet')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {pick(locale, 'تواصل مع العملاء', 'Communicate with customers', 'Müşterilerle iletişim kurun')}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm">
        <div className="flex flex-col items-center justify-center py-32 text-center px-6">
          <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-6">
            <MessageSquare className="h-10 w-10 text-slate-300" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">
            {pick(locale, 'المحادثات', 'Chat', 'Sohbet')}
          </h2>
          <p className="text-slate-500 max-w-sm leading-relaxed">
            {pick(locale, 'ميزة المحادثات قيد التطوير وستكون متاحة قريباً. ستتمكن من التواصل مع العملاء مباشرة من هنا.', 'The chat feature is currently under development and will be available soon. You will be able to communicate directly with customers from here.', 'Sohbet özelliği şu anda geliştirilmekte olup yakında kullanıma sunulacaktır. Müşterilerle doğrudan buradan iletişim kurabileceksiniz.')}
          </p>
          <span className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-sm font-bold">
            {pick(locale, 'قريباً', 'Coming Soon', 'Yakında')}
          </span>
        </div>
      </div>
    </div>
  )
}
