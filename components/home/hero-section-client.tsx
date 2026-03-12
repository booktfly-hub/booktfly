'use client'

import { useState } from 'react'
import { Search, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CityAutocomplete } from '@/components/shared/city-autocomplete'

interface HeroSectionClientProps {
  locale: string
  heroTitle: string
  heroSubtitle: string
  searchFrom: string
  searchTo: string
  searchButton: string
}

export function HeroSectionClient({
  locale,
  heroTitle,
  heroSubtitle,
  searchFrom,
  searchTo,
  searchButton,
}: HeroSectionClientProps) {
  const isAr = locale === 'ar'
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

  return (
    <section className="relative min-h-[100vh] flex flex-col items-center justify-center overflow-hidden pt-32 pb-20 bg-slate-50">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[50%] h-[50%] bg-gradient-to-br from-accent/10 to-transparent rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-gradient-to-tl from-primary/10 to-transparent rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <Link href={`/${locale}/become-provider`} className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-accent relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            </span>
            <span className="text-sm font-semibold tracking-wide text-slate-700 group-hover:text-slate-900 transition-colors">
              {isAr ? 'انضم كشريك سياحي الآن' : 'Join as a travel provider today'}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-all" />
          </Link>
        </div>

        <div className="text-center max-w-5xl mx-auto mb-16">
          <h1 className="text-[3rem] sm:text-[4.5rem] lg:text-[6rem] font-black tracking-tighter leading-[1.1] text-slate-900 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            {heroTitle.split(' ').map((word, i, arr) => {
              const isHighlight = i === arr.length - 1
              return (
                <span key={i} className={isHighlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent inline-block' : 'inline-block'}>
                  {word}&nbsp;
                </span>
              )
            })}
          </h1>

          <p className="mt-8 text-lg lg:text-xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed balance-text animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            {heroSubtitle}
          </p>
        </div>

        <div className="w-full max-w-4xl relative group z-20 animate-fade-in-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

          <div className="relative bg-white rounded-[2rem] p-2 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center">
            <form
              action={`/${locale}/trips`}
              className="flex flex-col sm:flex-row items-center w-full"
            >
              <input type="hidden" name="origin" value={origin} />
              <input type="hidden" name="destination" value={destination} />

              <CityAutocomplete
                value={origin}
                onChange={setOrigin}
                placeholder={searchFrom}
                className="h-16 text-lg rounded-[1.5rem]"
              />

              <div className="hidden sm:block w-px h-10 bg-slate-200 mx-2" />
              <div className="sm:hidden w-full h-px bg-slate-100 my-2 mx-4" />

              <CityAutocomplete
                value={destination}
                onChange={setDestination}
                placeholder={searchTo}
                className="h-16 text-lg rounded-[1.5rem]"
              />

              <div className="w-full sm:w-auto p-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-8 rounded-2xl bg-primary text-white font-bold hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20"
                >
                  <Search className="h-5 w-5" />
                  <span>{searchButton}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-6 opacity-70 hover:opacity-100 transition-opacity duration-300 animate-fade-in-up" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            {isAr ? 'موثوق من قبل المئات' : 'Trusted by thousands of travelers'}
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            {['Saudia', 'Flynas', 'Flyadeal', 'Emirates'].map((brand) => (
              <span key={brand} className="text-xl font-black text-slate-800">{brand}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
