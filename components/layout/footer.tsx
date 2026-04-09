'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Globe, Plane, Shield, CreditCard, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export function Footer() {
  const t = useTranslations()
  const locale = useLocale()

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <footer className="relative bg-slate-950 text-slate-200 mt-auto overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent/10 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24"
        >
          {/* Brand & Mission */}
          <motion.div variants={item} className="lg:col-span-5 flex flex-col items-start gap-8">
            <Link href={`/${locale}`} className="flex items-center gap-4 group">
              <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                <Image 
                  src="/booktfly-logo-symbol.png" 
                  alt="BooktFly" 
                  width={40} 
                  height={40} 
                  className="h-10 w-auto" 
                />
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter text-white leading-none uppercase">
                  BOOKTFLY
                </span>
                <span className="text-xs font-bold tracking-[0.2em] text-accent uppercase leading-none mt-1.5 opacity-80">
                  MENA Travel Hub
                </span>
              </div>
            </Link>
            
            <p className="text-xl font-medium text-slate-400 leading-relaxed max-w-md">
              {locale === 'ar'
                ? 'الوجهة الأولى لحجز رحلات الطيران الموثوقة بأسعار تنافسية في جميع أنحاء المملكة العربية السعودية والشرق الأوسط.'
                : 'The premier destination for reliable flight bookings at competitive prices across Saudi Arabia and the Middle East.'}
            </p>

            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, idx) => (
                <motion.a
                  key={idx}
                  href="#"
                  whileHover={{ y: -5, scale: 1.1 }}
                  className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shadow-lg"
                >
                  <Icon className="h-5 w-5 text-slate-300" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-16">
            <motion.div variants={item} className="flex flex-col gap-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                {locale === 'ar' ? 'اكتشف' : 'Discover'}
              </h3>
              <div className="flex flex-col gap-4">
                <Link
                  href={`/${locale}/trips`}
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {t('nav.browse_trips')}
                </Link>
                <Link
                  href={`/${locale}/become-provider`}
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {t('nav.become_provider')}
                </Link>
                <Link
                  href="#"
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {locale === 'ar' ? 'العروض الخاصة' : 'Special Offers'}
                </Link>
              </div>
            </motion.div>

            <motion.div variants={item} className="flex flex-col gap-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                {locale === 'ar' ? 'الشركة' : 'Company'}
              </h3>
              <div className="flex flex-col gap-4">
                <Link
                  href={`/${locale}/about`}
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {locale === 'ar' ? 'من نحن' : 'About Us'}
                </Link>
                <Link
                  href={`/${locale}/help`}
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {locale === 'ar' ? 'مركز المساعدة' : 'Help Center'}
                </Link>
                <Link
                  href={`/${locale}/help`}
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                   {t('footer.contact')}
                </Link>
              </div>
            </motion.div>

            <motion.div variants={item} className="flex flex-col gap-6 col-span-2 md:col-span-1">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">
                {locale === 'ar' ? 'قانوني' : 'Legal'}
              </h3>
              <div className="flex flex-col gap-4">
                <Link
                  href="#"
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                  {t('footer.terms')}
                </Link>
                <Link
                  href="#"
                  className="text-lg font-bold text-slate-400 hover:text-white transition-colors"
                >
                   {t('footer.privacy')}
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Features badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-y border-white/5"
        >
          <div className="flex items-center gap-4 px-6">
             <Shield className="h-10 w-10 text-accent opacity-80" />
             <div>
               <p className="font-bold text-white leading-none">{locale === 'ar' ? 'حجز آمن 100%' : '100% Secure Booking'}</p>
               <p className="text-sm text-slate-500 mt-1">{locale === 'ar' ? 'بياناتك دائماً في أمان' : 'Your data is always safe'}</p>
             </div>
          </div>
          <div className="flex items-center gap-4 px-6 border-x border-white/5">
             <CreditCard className="h-10 w-10 text-accent opacity-80" />
             <div>
               <p className="font-bold text-white leading-none">{locale === 'ar' ? 'خيارات دفع متنوعة' : 'Diverse Payment Options'}</p>
               <p className="text-sm text-slate-500 mt-1">{locale === 'ar' ? 'مدى، فيزا، ماستركارد' : 'Mada, Visa, Mastercard'}</p>
             </div>
          </div>
          <div className="flex items-center gap-4 px-6">
             <Globe className="h-10 w-10 text-accent opacity-80" />
             <div>
               <p className="font-bold text-white leading-none">{locale === 'ar' ? 'دعم فني 24/7' : '24/7 Technical Support'}</p>
               <p className="text-sm text-slate-500 mt-1">{locale === 'ar' ? 'نحن معك في كل خطوة' : 'We are with you every step'}</p>
             </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
          <p className="text-sm font-medium tracking-wide">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">{locale === 'ar' ? 'حالة النظام: متصل' : 'System Status: Online'}</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-50">BooktFly v2.0-2026</span>
          </div>
        </div>
      </div>
    </footer>
  )
}