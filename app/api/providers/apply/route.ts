import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { providerApplicationSchema } from '@/lib/validations'
import { notifyAdmin } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
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

    // Parse form data
    const formData = await request.formData()

    const rawData = {
      provider_type: formData.get('provider_type') as string,
      company_name_ar: formData.get('company_name_ar') as string,
      company_name_en: formData.get('company_name_en') as string | undefined,
      company_description_ar: formData.get('company_description_ar') as string | undefined,
      company_description_en: formData.get('company_description_en') as string | undefined,
      contact_email: formData.get('contact_email') as string,
      contact_phone: formData.get('contact_phone') as string,
      terms_accepted: formData.get('terms_accepted') === 'true' ? true as const : undefined,
    }

    // Validate
    const parsed = providerApplicationSchema.safeParse(rawData)
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      )
    }

    // Upload documents to Supabase Storage
    const docFields = [
      'doc_hajj_permit',
      'doc_commercial_reg',
      'doc_tourism_permit',
      'doc_civil_aviation',
      'doc_iata_permit',
    ] as const

    const docUrls: Record<string, string | null> = {}

    for (const field of docFields) {
      const file = formData.get(field) as File | null
      if (file && file.size > 0) {
        const ext = file.name.split('.').pop() || 'pdf'
        const filePath = `applications/${user.id}/${field}_${Date.now()}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())

        const { error: uploadError } = await supabaseAdmin.storage
          .from('provider-documents')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
          })

        if (!uploadError) {
          const { data: publicUrl } = supabaseAdmin.storage
            .from('provider-documents')
            .getPublicUrl(filePath)
          docUrls[`${field}_url`] = publicUrl.publicUrl
        } else {
          docUrls[`${field}_url`] = null
        }
      } else {
        docUrls[`${field}_url`] = null
      }
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
        doc_hajj_permit_url: docUrls.doc_hajj_permit_url,
        doc_commercial_reg_url: docUrls.doc_commercial_reg_url,
        doc_tourism_permit_url: docUrls.doc_tourism_permit_url,
        doc_civil_aviation_url: docUrls.doc_civil_aviation_url,
        doc_iata_permit_url: docUrls.doc_iata_permit_url,
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
