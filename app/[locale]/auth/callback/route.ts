import { after, NextResponse } from 'next/server'
import { getPostLoginRedirect } from '@/lib/auth-client'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'email' | 'recovery' | 'invite' | null
  const next = searchParams.get('next')

  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  const locale = pathSegments[1] || 'ar'

  const supabase = await createClient()
  let error = null

  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code)
    error = result.error
  } else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    error = result.error
  }

  if (!error && (code || (tokenHash && type))) {
    const { data: userData } = await supabase.auth.getUser()

    if (userData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, locale, referred_by, referral_code, full_name')
        .eq('id', userData.user.id)
        .maybeSingle()

      if (profile?.locale !== locale) {
        await supabase
          .from('profiles')
          .update({ locale })
          .eq('id', userData.user.id)
      }

      logActivity('user_login', { userId: userData.user.id })

      // Award signup points & handle referrals (off the critical path)
      after(async () => {
        try {
          await handlePostSignupRewards(userData.user!.id, profile?.referred_by ?? null, profile?.full_name ?? '')
        } catch (err) {
          console.error('Post-signup rewards error:', err)
        }
      })

      return NextResponse.redirect(
        `${origin}${getPostLoginRedirect({
          locale,
          redirectTo: next,
          role: profile?.role,
        })}`
      )
    }

    return NextResponse.redirect(`${origin}/${locale}`)
  }

  return NextResponse.redirect(`${origin}/${locale}/auth/login`)
}

async function handlePostSignupRewards(userId: string, referredBy: string | null, userName: string) {
  // Check if registration bonus already awarded (prevent duplicates on re-login)
  const { data: existing } = await supabaseAdmin
    .from('customer_points_transactions')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', 'registration_bonus')
    .maybeSingle()

  if (existing) return // Already awarded

  // 1. Award customer 200 pts registration bonus
  await supabaseAdmin.from('customer_points_transactions').insert({
    user_id: userId,
    points: 200,
    event_type: 'registration_bonus',
    description_ar: 'مكافأة التسجيل',
    description_en: 'Registration bonus',
  })

  await notify({
    userId,
    type: 'points_earned',
    titleAr: 'مبروك! حصلت على 200 نقطة',
    titleEn: 'Congrats! You earned 200 points',
    bodyAr: 'حصلت على 200 نقطة كمكافأة تسجيل. ادعُ أصدقاءك واحصل على المزيد!',
    bodyEn: 'You earned 200 points as a registration bonus. Invite friends to earn more!',
    data: { points: '200', event: 'registration_bonus' },
  })

  if (!referredBy) return

  // 2. Check if referred by a marketeer (MKT- prefix)
  if (referredBy.startsWith('MKT-')) {
    const { data: marketeer } = await supabaseAdmin
      .from('marketeers')
      .select('id, user_id')
      .eq('referral_code', referredBy)
      .eq('status', 'active')
      .maybeSingle()

    if (marketeer) {
      // Award marketeer 150 pts for inviting a customer
      await supabaseAdmin.from('flypoints_transactions').insert({
        marketeer_id: marketeer.user_id,
        points: 150,
        event_type: 'invite_customer',
        reference_id: userId,
        description_ar: `نقاط دعوة عميل جديد: ${userName}`,
        description_en: `Points for inviting new customer: ${userName}`,
      })

      await notify({
        userId: marketeer.user_id,
        type: 'points_earned',
        titleAr: 'عميل جديد سجّل عبر رابطك!',
        titleEn: 'New customer signed up via your link!',
        bodyAr: `${userName} سجّل عبر رابط إحالتك. حصلت على 150 نقطة!`,
        bodyEn: `${userName} signed up via your referral link. You earned 150 points!`,
        data: { points: '150', event: 'invite_customer', user_id: userId },
      })
    }
  }

  // 3. Check if referred by a customer (USR- prefix)
  if (referredBy.startsWith('USR-')) {
    const { data: referrer } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('referral_code', referredBy)
      .maybeSingle()

    if (referrer) {
      // Award referring customer 150 pts
      await supabaseAdmin.from('customer_points_transactions').insert({
        user_id: referrer.id,
        points: 150,
        event_type: 'invite_friend',
        reference_id: userId,
        description_ar: `نقاط دعوة صديق: ${userName}`,
        description_en: `Points for inviting friend: ${userName}`,
      })

      await notify({
        userId: referrer.id,
        type: 'points_earned',
        titleAr: 'صديقك سجّل عبر رابطك!',
        titleEn: 'Your friend signed up via your link!',
        bodyAr: `${userName} سجّل عبر رابط دعوتك. حصلت على 150 نقطة!`,
        bodyEn: `${userName} signed up via your invite link. You earned 150 points!`,
        data: { points: '150', event: 'invite_friend', user_id: userId },
      })
    }
  }
}
