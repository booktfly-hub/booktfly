'use client'

import { pick } from '@/lib/i18n-helpers'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { Star, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Review = { id: string; reviewer_name: string; rating: number; comment: string | null; created_at: string }
type ReviewsData = { reviews: Review[]; avg_rating: number; total: number }

export default function MarkeeteerReviewsPage() {
  const locale = useLocale() as 'ar' | 'en' | 'tr'
  const isAr = locale === 'ar'
  const [data, setData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/marketeers/reviews', { headers: { 'Accept-Language': locale } })
      .then((r) => r.json())
      .then((res) => setData(res.data ?? null))
      .finally(() => setLoading(false))
  }, [locale])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const reviews = data?.reviews ?? []
  const avg = data?.avg_rating ?? 0

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {pick(locale, 'التقييمات', 'Reviews', 'Yorumlar')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {pick(locale, 'تقييمات العملاء لك', 'Customer reviews for you', 'Sizin için müşteri yorumları')}
        </p>
      </div>

      {/* Rating summary */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="text-center shrink-0">
            <p className="text-7xl font-black text-slate-900 tracking-tighter">{avg.toFixed(1)}</p>
            <div className="flex gap-1 justify-center mt-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn('h-5 w-5', s <= Math.round(avg) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200')} />
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              {pick(locale, `${reviews.length} تقييم`, `${reviews.length} reviews`)}
            </p>
          </div>

          <div className="w-px h-24 bg-slate-100 hidden sm:block" />

          <div className="flex-1 w-full space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter((r) => r.rating === star).length
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-4 text-end font-bold text-slate-600">{star}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-slate-400 font-medium">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900">{pick(locale, 'جميع التقييمات', 'All Reviews', 'Tüm Yorumlar')}</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Star className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">{pick(locale, 'لا توجد تقييمات بعد', 'No reviews yet', 'Henüz yorum yok')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((r) => (
              <div key={r.id} className="p-6 md:p-8 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <span className="text-yellow-600 font-black text-sm">{r.reviewer_name[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{r.reviewer_name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('h-3.5 w-3.5', s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200')} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 shrink-0">
                    {new Date(r.created_at).toLocaleDateString(pick(locale, 'ar-SA', 'en-US', 'tr-TR'))}
                  </p>
                </div>
                {r.comment && <p className="text-slate-600 text-sm leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
