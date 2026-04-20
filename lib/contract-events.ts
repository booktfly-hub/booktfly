import { supabaseAdmin } from '@/lib/supabase/admin'
import { hashIp } from '@/lib/geo'

type EventType = 'signed' | 'viewed' | 'reprinted' | 'reminder_sent'
type TargetType =
  | 'booking'
  | 'room_booking'
  | 'car_booking'
  | 'package_booking'
  | 'provider_application'
  | 'marketeer_application'

type LogArgs = {
  event_type: EventType
  target_type: TargetType
  target_id: string
  actor_id?: string | null
  actor_role?: string | null
  ip_raw?: string | null
  user_agent?: string | null
  metadata?: Record<string, unknown>
}

export async function logContractEvent(args: LogArgs) {
  try {
    await supabaseAdmin.from('contract_events').insert({
      event_type: args.event_type,
      target_type: args.target_type,
      target_id: args.target_id,
      actor_id: args.actor_id ?? null,
      actor_role: args.actor_role ?? null,
      ip_hash: args.ip_raw ? hashIp(args.ip_raw) : null,
      user_agent: args.user_agent ?? null,
      metadata: args.metadata ?? {},
    })
  } catch (err) {
    console.error('logContractEvent failed:', err)
    // Non-fatal
  }
}

export function extractClientMeta(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
  const userAgent = request.headers.get('user-agent') || null
  return { ip, userAgent }
}
