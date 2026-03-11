import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types'

const resend = new Resend(process.env.RESEND_API_KEY)

type NotifyOptions = {
  userId: string
  type: NotificationType
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  data?: Record<string, string>
  email?: {
    subject: string
    html: string
  }
}

export async function notify(options: NotifyOptions) {
  // 1. Create in-app notification
  await supabaseAdmin.from('notifications').insert({
    user_id: options.userId,
    type: options.type,
    title_ar: options.titleAr,
    title_en: options.titleEn,
    body_ar: options.bodyAr,
    body_en: options.bodyEn,
    data: options.data,
  })

  // 2. Send email if provided
  if (options.email) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', options.userId)
      .single()

    if (profile?.email) {
      try {
        await resend.emails.send({
          from: 'BooktFly <noreply@booktfly.com>',
          to: profile.email,
          subject: options.email.subject,
          html: options.email.html,
        })
      } catch (error) {
        console.error('Failed to send email:', error)
      }
    }
  }
}

export async function notifyAdmin(options: Omit<NotifyOptions, 'userId'>) {
  // Find admin user
  const { data: admin } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (admin) {
    await notify({ ...options, userId: admin.id })
  }
}
