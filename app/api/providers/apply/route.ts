import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { providerApplicationSchema } from '@/lib/validations'
import { notifyAdmin } from '@/lib/notifications'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { limit: 3, windowMs: 60_000 })
    if (limited) return limited

    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { data: null, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a buyer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'buyer') {
      return NextResponse.json(
        { data: null, error: 'Only buyers can apply to become providers' },
        { status: 403 }
      )
    }

    // Check no existing pending or approved application
    const { data: existingApp } = await supabaseAdmin
      .from('provider_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending_review', 'approved'])
      .limit(1)
      .single()

    if (existingApp) {
      return NextResponse.json(
        { data: null, error: 'You already have a pending or approved application' },
        { status: 409 }
      )
    }

    // Parse JSON body (documents are uploaded client-side to Supabase Storage)
    const body = await request.json()

    const rawData = {
      provider_type: body.provider_type as string,
      company_name_ar: body.company_name_ar as string,
      company_name_en: body.company_name_en as string | undefined,
      company_description_ar: body.company_description_ar as string | undefined,
      company_description_en: body.company_description_en as string | undefined,
      contact_email: body.contact_email as string,
      contact_phone: body.contact_phone as string,
      terms_accepted: body.terms_accepted === true || body.terms_accepted === 'true' ? true as const : undefined,
    }

    // Validate
    const parsed = providerApplicationSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    // Insert application using admin client (bypasses RLS)
    const { data: application, error: insertError } = await supabaseAdmin
      .from('provider_applications')
      .insert({
        user_id: user.id,
        provider_type: parsed.data.provider_type,
        company_name_ar: parsed.data.company_name_ar,
        company_name_en: parsed.data.company_name_en || null,
        company_description_ar: parsed.data.company_description_ar || null,
        company_description_en: parsed.data.company_description_en || null,
        contact_email: parsed.data.contact_email,
        contact_phone: parsed.data.contact_phone,
        doc_hajj_permit_url: body.doc_hajj_permit_url || null,
        doc_commercial_reg_url: body.doc_commercial_reg_url || null,
        doc_tourism_permit_url: body.doc_tourism_permit_url || null,
        doc_civil_aviation_url: body.doc_civil_aviation_url || null,
        doc_iata_permit_url: body.doc_iata_permit_url || null,
        terms_accepted_at: new Date().toISOString(),
        status: 'pending_review',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert application:', insertError)
      return NextResponse.json(
        { data: null, error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    // Notify admin
    await notifyAdmin({
      type: 'new_application',
      titleAr: 'طلب انضمام جديد',
      titleEn: 'New Provider Application',
      bodyAr: `تم تقديم طلب انضمام جديد من ${parsed.data.company_name_ar}`,
      bodyEn: `New application received from ${parsed.data.company_name_en || parsed.data.company_name_ar}`,
      data: { application_id: application.id },
    })

    return NextResponse.json({ data: application, error: null })
  } catch (error) {
    console.error('Provider apply error:', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
