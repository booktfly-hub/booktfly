import { after, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { logActivity } from '@/lib/activity-log'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('marketeer_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const { action, comment } = await request.json() as { action: 'approve' | 'reject'; comment?: string }

    const { data: application, error: fetchError } = await supabaseAdmin
      .from('marketeer_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (application.status !== 'pending_review') return NextResponse.json({ error: 'Application already reviewed' }, { status: 400 })

    if (action === 'approve') {
      // 1. Generate referral code first (no side effects yet)
      const { data: codeRow, error: codeError } = await supabaseAdmin.rpc('generate_referral_code')
      if (codeError || !codeRow) {
        console.error('Failed to generate referral code:', codeError)
        return NextResponse.json({ error: 'Failed to generate referral code' }, { status: 500 })
      }
      const referralCode = codeRow as string

      // 2. Check if this new marketeer was referred by another marketeer
      const { data: newMktProfile } = await supabaseAdmin
        .from('profiles')
        .select('referred_by')
        .eq('id', application.user_id)
        .single()

      let referredByMarketeerId: string | null = null
      if (newMktProfile?.referred_by?.startsWith('MKT-')) {
        const { data: parentMkt } = await supabaseAdmin
          .from('marketeers')
          .select('id, user_id')
          .eq('referral_code', newMktProfile.referred_by)
          .eq('status', 'active')
          .maybeSingle()
        if (parentMkt) referredByMarketeerId = parentMkt.id
      }

      // 3. Create marketeer row
      const { error: mktError } = await supabaseAdmin
        .from('marketeers')
        .insert({
          user_id:                 application.user_id,
          application_id:          application.id,
          full_name:               application.full_name,
          national_id:             application.national_id,
          phone:                   application.phone,
          referral_code:           referralCode,
          status:                  'active',
          referred_by_marketeer_id: referredByMarketeerId,
        })

      if (mktError) {
        console.error('Failed to create marketeer:', mktError)
        return NextResponse.json({ error: 'Failed to create marketeer profile' }, { status: 500 })
      }

      // 3. Update profile role
      const { error: roleError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'marketeer' })
        .eq('id', application.user_id)

      if (roleError) {
        console.error('Failed to update role:', roleError)
        // Roll back marketeer row before returning
        await supabaseAdmin.from('marketeers').delete().eq('user_id', application.user_id)
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
      }

      // 4. Award registration bonus
      await supabaseAdmin.from('flypoints_transactions').insert({
        marketeer_id:   application.user_id,
        points:         500,
        event_type:     'registration_bonus',
        description_ar: 'مكافأة التسجيل كمسوّق',
        description_en: 'Marketeer registration bonus',
      })

      // 5. Mark application approved — only now that everything else succeeded
      await supabaseAdmin
        .from('marketeer_applications')
        .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq('id', id)

      // 6. Notify off the critical path
      after(async () => {
        try {
          await notify({
            userId:  application.user_id,
            type:    'marketeer_application_approved',
            titleAr: 'تم قبول طلبك كمسوّق!',
            titleEn: 'Marketeer Application Approved!',
            bodyAr:  `تم تفعيل حسابك كمسوّق. رمز إحالتك: ${referralCode}`,
            bodyEn:  `Your marketeer account is now active. Your referral code: ${referralCode}`,
            data:    { referral_code: referralCode },
          })

          // Circle 2: Award 300 pts to the marketeer who invited this new marketeer
          if (referredByMarketeerId) {
            const { data: parentMkt } = await supabaseAdmin
              .from('marketeers')
              .select('user_id')
              .eq('id', referredByMarketeerId)
              .single()

            if (parentMkt) {
              await supabaseAdmin.from('flypoints_transactions').insert({
                marketeer_id:   parentMkt.user_id,
                points:         300,
                event_type:     'referral_marketeer',
                reference_id:   application.user_id,
                description_ar: `نقاط دعوة مسوّق جديد: ${application.full_name}`,
                description_en: `Points for inviting new marketeer: ${application.full_name}`,
              })

              await notify({
                userId:  parentMkt.user_id,
                type:    'points_earned',
                titleAr: 'مسوّق جديد انضم عبر رابطك!',
                titleEn: 'New marketeer joined via your link!',
                bodyAr:  `${application.full_name} أصبح مسوّقاً عبر رابط إحالتك. حصلت على 300 نقطة!`,
                bodyEn:  `${application.full_name} became a marketeer via your referral. You earned 300 points!`,
                data:    { points: '300', event: 'referral_marketeer', marketeer_name: application.full_name },
              })
            }
          }
        } catch (err) {
          console.error('Failed to notify marketeer approval:', err)
        }
      })

      logActivity('marketeer_joined', { userId: application.user_id, metadata: { applicationId: id } })

      return NextResponse.json({ success: true, action: 'approved', referral_code: referralCode })
    }

    if (action === 'reject') {
      if (!comment?.trim()) return NextResponse.json({ error: 'Rejection comment is required' }, { status: 400 })

      await supabaseAdmin
        .from('marketeer_applications')
        .update({ status: 'rejected', admin_comment: comment, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq('id', id)

      after(async () => {
        try {
          await notify({
            userId:  application.user_id,
            type:    'marketeer_application_rejected',
            titleAr: 'تم رفض طلبك كمسوّق',
            titleEn: 'Marketeer Application Rejected',
            bodyAr:  `سبب الرفض: ${comment}`,
            bodyEn:  `Reason: ${comment}`,
            data:    { application_id: application.id },
          })
        } catch (err) {
          console.error('Failed to notify marketeer rejection:', err)
        }
      })

      return NextResponse.json({ success: true, action: 'rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
