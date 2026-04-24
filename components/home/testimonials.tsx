import { pick } from '@/lib/i18n-helpers'
import { Star } from 'lucide-react'

interface TestimonialsProps {
  locale: string
}

const reviews = [
  {
    nameEn: 'Ahmad Al-Dosari',
    nameAr: 'أحمد الدوسري',
    roleEn: 'Frequent Traveler',
    roleAr: 'مسافر دائم',
    textEn: 'The easiest way to book domestic flights in Saudi Arabia. Highly recommended!',
    textAr: 'أسهل طريقة لحجز رحلات الطيران الداخلية في السعودية. أوصي بها بشدة!',
    rating: 5
  },
  {
    nameEn: 'Sarah Khalid',
    nameAr: 'سارة خالد',
    roleEn: 'Business Owner',
    roleAr: 'صاحبة عمل',
    textEn: 'I love how transparent the pricing is. No hidden fees at checkout.',
    textAr: 'أحب شفافية الأسعار. لا توجد رسوم خفية عند الدفع.',
    rating: 5
  },
  {
    nameEn: 'Mohammed Ali',
    nameAr: 'محمد علي',
    roleEn: 'Travel Agency Partner',
    roleAr: 'شريك سياحي',
    textEn: 'As a provider, BooktFly has doubled our bookings. Great platform.',
    textAr: 'كمزود، ساعدتنا المنصة في مضاعفة حجوزاتنا. منصة رائعة جداً.',
    rating: 5
  },
  {
    nameEn: 'Faisal Omar',
    nameAr: 'فيصل عمر',
    roleEn: 'Tourist',
    roleAr: 'سائح',
    textEn: 'Customer support is incredibly fast. They resolved my issue in minutes.',
    textAr: 'دعم العملاء سريع بشكل لا يصدق. قاموا بحل مشكلتي في دقائق.',
    rating: 5
  },
  {
    nameEn: 'Noura S.',
    nameAr: 'نورة س.',
    roleEn: 'Family Traveler',
    roleAr: 'مسافرة مع العائلة',
    textEn: 'Booking for my family of 5 was seamless and very organized.',
    textAr: 'حجزت لعائلتي المكونة من 5 أشخاص وكان الأمر سلساً ومنظماً للغاية.',
    rating: 5
  }
]

export function Testimonials({ locale }: TestimonialsProps) {
  const isAr = locale === 'ar'
  
  // Duplicate array to create an infinite loop effect
  const marqueeReviews = [...reviews, ...reviews]

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f9fbff_35%,#fff7ed_100%)]" />
      <div className="absolute left-[-10%] top-10 h-72 w-72 rounded-full bg-sky-100/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] h-80 w-80 rounded-full bg-orange-100/50 blur-[110px] pointer-events-none" />

      <div className="relative z-10 mx-auto mb-20 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-sky-700">
          {pick(locale, 'آراء المسافرين', 'Traveler feedback', 'Yolcu geri bildirimi')}
        </p>
        <h2 className="mb-6 text-4xl font-serif font-bold tracking-wide text-[#111111] md:text-[3.5rem]">
          {pick(locale, 'ماذا يقول عملاؤنا', 'What Our Users Say', 'Kullanıcılarımız Ne Diyor')}
        </h2>
        <div className="flex items-center justify-center gap-3 font-serif text-lg text-slate-600 md:text-xl">
          <span className="rounded-xl border border-orange-100 bg-white px-4 py-1.5 font-bold text-slate-800 shadow-sm">4.9/5</span>
          <span className="font-medium">{pick(locale, 'تقييم من آلاف المسافرين', 'Rating from thousands of travelers', 'Binlerce yolcudan puan')}</span>
        </div>
      </div>

      <div className="relative flex w-full group py-8">
        <div className="absolute bottom-0 left-0 top-0 z-10 w-32 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none md:w-64" />
        <div className="absolute bottom-0 right-0 top-0 z-10 w-32 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none md:w-64" />

        <div className="flex w-fit animate-marquee hover:[animation-play-state:paused]" style={{
            animationDirection: pick(locale, 'reverse', 'normal', 'normal')
        }}>
          {marqueeReviews.map((review, idx) => {
            const isHoveredOrMiddle = idx % 2 !== 0 // Simulate the effect from screenshot where some are muted
            
            return (
              <div
                key={idx}
                className="group/card relative mx-4 w-[320px] flex-shrink-0 rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,250,245,0.9))] p-8 shadow-lg shadow-slate-100/70 transition-all duration-300 hover:-translate-y-2 hover:border-orange-200 hover:shadow-xl md:w-[420px] md:p-10"
              >
                <div className={`absolute inset-x-8 top-0 h-1 rounded-b-full ${isHoveredOrMiddle ? 'bg-gradient-to-r from-sky-400 via-orange-400 to-emerald-400' : 'bg-slate-100'}`} />
                <div className="flex items-center gap-1 mb-8">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 fill-current ${isHoveredOrMiddle ? 'text-orange-300 group-hover/card:text-orange-400' : 'text-slate-100'}`} />
                  ))}
                </div>
                <p className={`mb-12 whitespace-normal text-lg font-serif leading-relaxed ${isHoveredOrMiddle ? 'text-[#111111]' : 'text-slate-300'}`}>
                  "{isAr ? review.textAr : review.textEn}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full border text-xl font-serif font-bold ${isHoveredOrMiddle ? 'border-sky-100 bg-sky-50 text-[#111111]' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                    {isAr ? review.nameAr[0] : review.nameEn[0]}
                  </div>
                  <div>
                    <h4 className={`font-bold font-serif text-lg ${isHoveredOrMiddle ? 'text-[#111111]' : 'text-slate-300'}`}>
                      {isAr ? review.nameAr : review.nameEn}
                    </h4>
                    <p className={`mt-1 inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${isHoveredOrMiddle ? 'bg-orange-50 text-orange-700' : 'bg-slate-50 text-slate-300'}`}>
                      {isAr ? review.roleAr : review.roleEn}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Add custom CSS for animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 40s linear infinite;
          }
          .rtl .animate-marquee {
            animation-direction: reverse;
          }
        `}} />
      </div>
    </section>
  )
}
