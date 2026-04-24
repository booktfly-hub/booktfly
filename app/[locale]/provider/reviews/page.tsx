import { pick } from '@/lib/i18n-helpers'
import { getLocale, getTranslations } from 'next-intl/server'
import { Star, MessageSquare } from 'lucide-react'
import { getProvider } from '@/lib/supabase/provider'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'

type ReviewerProfile = {
  id: string
  full_name: string
  avatar_url: string | null
}

type Review = {
  id: string
  rating: number
  comment: string | null
  item_type: string
  created_at: string
  reviewer: ReviewerProfile | null
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4',
            s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
          )}
        />
      ))}
    </div>
  )
}

function ItemTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    trip: 'bg-blue-100 text-blue-700',
    room: 'bg-emerald-100 text-emerald-700',
    car: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide', colors[type] ?? 'bg-slate-100 text-slate-600')}>
      {type}
    </span>
  )
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
]

function avatarColor(id: string): string {
  let n = 0
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

export default async function ProviderReviewsPage() {
  const locale = await getLocale()
  const isAr = locale === 'ar'
  const t = await getTranslations('provider')

  const { provider } = await getProvider(locale)

  const { data } = await supabaseAdmin
    .from('reviews')
    .select('*, reviewer:profiles!reviewer_id(id, full_name, avatar_url)')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })
    .range(0, 49)

  const reviews = (data ?? []) as Review[]

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length
    return {
      stars,
      count,
      pct: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0,
    }
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          {pick(locale, 'تقييماتي', 'My Reviews', 'Yorumlarım')}
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {pick(locale, 'جميع التقييمات التي حصلت عليها من العملاء', 'All reviews received from your customers', 'Müşterilerinizden alınan tüm yorumlar')}
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <span className="text-6xl font-black text-slate-900">{reviews.length > 0 ? avgRating.toFixed(1) : '—'}</span>
            <Stars rating={Math.round(avgRating)} size="lg" />
            <span className="text-sm font-bold text-slate-400">
              {reviews.length} {pick(locale, 'تقييم', 'reviews', 'yorum')}
            </span>
          </div>

          {reviews.length > 0 && (
            <div className="flex-1 space-y-2 w-full">
              {distribution.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-8 shrink-0">
                    <span className="text-sm font-bold text-slate-600">{stars}</span>
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-400 w-8 text-end">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews list */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900">
            {pick(locale, 'جميع التقييمات', 'All Reviews', 'Tüm Yorumlar')}
          </h2>
        </div>

        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            message={pick(locale, 'لا توجد تقييمات بعد', 'No reviews yet', 'Henüz yorum yok')}
            description={pick(locale, 'ستظهر تقييمات عملائك هنا بعد إتمام الحجوزات', 'Customer reviews will appear here after completed bookings', 'Müşteri yorumları tamamlanan rezervasyonlardan sonra burada görünecek')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => {
              const name = review.reviewer?.full_name ?? (pick(locale, 'مجهول', 'Anonymous', 'Anonim'))
              const initials = getInitials(review.reviewer?.full_name)
              const color = avatarColor(review.reviewer?.id ?? review.id)
              const date = new Date(review.created_at).toLocaleDateString(
                pick(locale, 'ar-SA', 'en-US', 'tr-TR'),
                { year: 'numeric', month: 'short', day: 'numeric' }
              )

              return (
                <div key={review.id} className="p-6 md:p-8 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={cn('h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-white font-black text-sm', color)}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-bold text-slate-900">{name}</span>
                        <ItemTypeBadge type={review.item_type} />
                        <span className="text-xs text-slate-400 font-medium">{date}</span>
                      </div>
                      <Stars rating={review.rating} size="sm" />
                      {review.comment && (
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
