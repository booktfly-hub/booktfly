import { supabaseAdmin } from '@/lib/supabase/admin'

export type ActivityEventType =
  | 'site_visit'
  | 'user_registered'
  | 'user_login'
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_refunded'
  | 'payment_received'
  | 'provider_joined'
  | 'provider_suspended'
  | 'trip_created'
  | 'trip_removed'
  | 'trip_expired'
  | 'trip_sold_out'
  | 'room_created'
  | 'room_removed'
  | 'room_booking_created'
  | 'room_booking_confirmed'
  | 'marketeer_joined'
  | 'marketeer_application'
  | 'provider_application'
  | 'withdrawal_requested'
  | 'withdrawal_completed'
  | 'flight_request_created'
  | 'email_registered'
  | 'seat_reserved'
  | 'seat_released'
  | 'car_created'
  | 'car_removed'
  | 'car_booking_created'
  | 'car_booking_confirmed'
  | 'package_created'
  | 'package_removed'
  | 'package_booking_created'
  | 'package_booking_confirmed'
  | 'package_booking_cancelled'
  | 'trip_request_offer_created'
  | 'trip_request_offer_accepted'

export async function logActivity(
  eventType: ActivityEventType,
  options?: {
    userId?: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }
) {
  try {
    await supabaseAdmin.from('activity_logs').insert({
      event_type: eventType,
      user_id: options?.userId || null,
      metadata: options?.metadata || {},
      ip_address: options?.ipAddress || null,
      user_agent: options?.userAgent || null,
    })
  } catch {
    // silently fail - activity logging should never break the main flow
  }
}

export async function createAlert(
  alertType: string,
  severity: 'info' | 'warning' | 'critical',
  titleAr: string,
  titleEn: string,
  bodyAr?: string,
  bodyEn?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabaseAdmin.from('admin_alerts').insert({
      alert_type: alertType,
      severity,
      title_ar: titleAr,
      title_en: titleEn,
      body_ar: bodyAr || null,
      body_en: bodyEn || null,
      metadata: metadata || {},
    })
  } catch {
    // silently fail
  }
}
