import { supabaseAdmin } from '@/lib/supabase/admin'

type Locale = 'ar' | 'en'

function renderVars(text: string, vars: Record<string, string | number>) {
  return text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_m, key) => {
    const v = vars[key]
    return v === undefined || v === null ? `{{${key}}}` : String(v)
  })
}

/**
 * Render an email template by slug. Returns { subject, html } in the requested locale.
 * If the template row does not exist or is disabled, returns null — caller falls back
 * to the hardcoded React Email template in emails/.
 */
export async function renderEmailTemplate(
  slug: string,
  vars: Record<string, string | number>,
  locale: Locale = 'ar'
): Promise<{ subject: string; html: string } | null> {
  const { data } = await supabaseAdmin
    .from('email_templates')
    .select('subject_ar, subject_en, body_html_ar, body_html_en, enabled')
    .eq('slug', slug)
    .maybeSingle()
  if (!data || !data.enabled) return null
  const subject = locale === 'ar' ? data.subject_ar : data.subject_en
  const html = locale === 'ar' ? data.body_html_ar : data.body_html_en
  return {
    subject: renderVars(subject, vars),
    html: renderVars(html, vars),
  }
}

export async function renderWhatsappTemplate(
  slug: string,
  vars: Record<string, string | number>,
  locale: Locale = 'ar'
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('whatsapp_templates')
    .select('body_ar, body_en, enabled')
    .eq('slug', slug)
    .maybeSingle()
  if (!data || !data.enabled) return null
  return renderVars(locale === 'ar' ? data.body_ar : data.body_en, vars)
}
