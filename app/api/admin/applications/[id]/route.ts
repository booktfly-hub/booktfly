import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from '@/lib/notifications'
import { render } from '@react-email/components'
import ApplicationApproved from '@/emails/application-approved'
import ApplicationRejected from '@/emails/application-rejected'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params

    const { data: application, error } = await supabaseAdmin
      .from('provider_applications')
      .select('*, profiles:user_id(full_name, email)')
      .eq('id', id)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json(application)
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const body = await request.json()
    const { action, comment } = body as { action: 'approve' | 'reject'; comment?: string }

    // Fetch the application
    const { data: application, error: fetchError } = await supabaseAdmin
      .from('provider_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.status !== 'pending_review') {
      return NextResponse.json({ error: 'Application already reviewed' }, { status: 400 })
    }

    if (action === 'approve') {
      // 1. Update application status
      const { error: updateError } = await supabaseAdmin
        .from('provider_applications')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
      }

      // 2. Create provider row
      const { error: providerError } = await supabaseAdmin
        .from('providers')
        .insert({
          user_id: application.user_id,
          application_id: application.id,
          provider_type: application.provider_type,
          company_name_ar: application.company_name_ar,
          company_name_en: application.company_name_en,
          company_description_ar: application.company_description_ar,
          company_description_en: application.company_description_en,
          contact_email: application.contact_email,
          contact_phone: application.contact_phone,
          status: 'active',
          has_hajj_permit: !!application.doc_hajj_permit_url,
          has_commercial_reg: !!application.doc_commercial_reg_url,
          has_tourism_permit: !!application.doc_tourism_permit_url,
          has_civil_aviation: !!application.doc_civil_aviation_url,
          has_iata_permit: !!application.doc_iata_permit_url,
        })

      if (providerError) {
        return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
      }

      // 3. Update user role to provider
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'provider' })
        .eq('id', application.user_id)

      // 4. Notify provider
      const approvedHtml = await render(ApplicationApproved({
        companyName: application.company_name_ar,
        locale: 'ar',
      }))

      await notify({
        userId: application.user_id,
        type: 'application_approved',
        titleAr: 'تم قبول طلبك!',
        titleEn: 'Application Approved!',
        bodyAr: 'يمكنك الآن البدء بنشر الرحلات على بوكت فلاي',
        bodyEn: 'You can now start posting trips on BooktFly',
        data: { application_id: application.id },
        email: {
          subject: 'تمت الموافقة على طلبك! - BooktFly',
          html: approvedHtml,
        },
      })

      return NextResponse.json({ success: true, action: 'approved' })
    }

    if (action === 'reject') {
      if (!comment?.trim()) {
        return NextResponse.json({ error: 'Rejection comment is required' }, { status: 400 })
      }

      // 1. Update application status
      const { error: updateError } = await supabaseAdmin
        .from('provider_applications')
        .update({
          status: 'rejected',
          admin_comment: comment,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
      }

      // 2. Notify provider
      const rejectedHtml = await render(ApplicationRejected({
        companyName: application.company_name_ar,
        comment,
        locale: 'ar',
      }))

      await notify({
        userId: application.user_id,
        type: 'application_rejected',
        titleAr: 'تم رفض طلبك',
        titleEn: 'Application Rejected',
        bodyAr: `سبب الرفض: ${comment}`,
        bodyEn: `Reason: ${comment}`,
        data: { application_id: application.id },
        email: {
          subject: 'تحديث حالة طلبك - BooktFly',
          html: rejectedHtml,
        },
      })

      return NextResponse.json({ success: true, action: 'rejected' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
