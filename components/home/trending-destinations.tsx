import { pick } from '@/lib/i18n-helpers'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowLeft } from 'lucide-react'

interface TrendingDestinationsProps {
  locale: string
}

const destinations = [
  {
    id: 'madinah',
    nameEn: 'Madinah',
    nameAr: 'المدينة المنورة',
    image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=2070&auto=format&fit=crop',
    dealsEn: '20+ Deals',
    dealsAr: '٢٠+ عرض',
    colSpan: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 'jeddah',
    nameEn: 'Jeddah',
    nameAr: 'جدة',
    image: 'https://images.unsplash.com/photo-1596306499300-0b7b1689b9f6?q=80&w=2070&auto=format&fit=crop',
    dealsEn: '12+ Deals',
    dealsAr: '١٢+ عرض',
    colSpan: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 'dubai',
    nameEn: 'Dubai',
    nameAr: 'دبي',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop',
    dealsEn: '25+ Deals',
    dealsAr: '٢٥+ عرض',
    colSpan: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 'cairo',
    nameEn: 'Cairo',
    nameAr: 'القاهرة',
    image: 'https://images.unsplash.com/photo-1539667468225-eebb663053e6?q=80&w=2069&auto=format&fit=crop',
    dealsEn: '18+ Deals',
    dealsAr: '١٨+ عرض',
    colSpan: 'md:col-span-2 md:row-span-1'
  }
]

export function TrendingDestinations({ locale }: TrendingDestinationsProps) {
  const isAr = locale === 'ar'
  const Arrow = isAr ? ArrowLeft : ArrowRight

  return (
    <section className="py-24 bg-slate-50 overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full mb-4 border border-primary/10">
              <span className="text-sm font-bold text-primary uppercase tracking-widest">
                {pick(locale, 'اكتشف العالم', 'Discover the World', 'Dünyayı Keşfet')}
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
              {pick(locale, 'وجهات سياحية رائجة', 'Trending Destinations', 'Popüler Varış Noktaları')}
            </h2>
          </div>
          
          <div>
            <Link
              href={`/${locale}/trips`}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-1"
            >
              {pick(locale, 'عرض كل الوجهات', 'View All Destinations', 'Tüm Varış Noktalarını Görüntüle')}
              <Arrow className="h-5 w-5 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className={`group relative overflow-hidden rounded-3xl ${dest.colSpan} h-[250px] md:h-auto`}
            >
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent opacity-80 z-10" />
              
              <Image
                src={dest.image}
                alt={isAr ? dest.nameAr : dest.nameEn}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 z-20 flex items-end justify-between">
                <div>
                  <h3 className="text-3xl font-black text-white mb-2 drop-shadow-md">
                    {isAr ? dest.nameAr : dest.nameEn}
                  </h3>
                  <p className="text-white/90 font-medium bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg inline-block text-sm border border-white/20">
                    {isAr ? dest.dealsAr : dest.dealsEn}
                  </p>
                </div>
                
                <div className="h-12 w-12 rounded-full bg-white text-primary flex items-center justify-center opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 shadow-xl">
                  <Arrow className="h-5 w-5 rtl:rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}