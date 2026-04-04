const API_ERROR_KEY_MAP: Record<string, string> = {
  Unauthorized: 'unauthorized',
  Forbidden: 'forbidden',
  'Internal server error': 'generic',
  'Not found': 'not_found',
  'Application not found': 'application_not_found',
  'Application already reviewed': 'application_already_reviewed',
  'Failed to update application': 'application_update_failed',
  'Failed to create provider': 'provider_create_failed',
  'Provider not found': 'provider_not_found',
  'Suspension reason is required': 'suspension_reason_required',
  'Failed to suspend provider': 'provider_suspend_failed',
  'Failed to unsuspend provider': 'provider_unsuspend_failed',
  'Commission rate is required': 'commission_rate_required',
  'Commission rate must be between 0 and 100': 'commission_rate_invalid',
  'Failed to update commission rate': 'commission_rate_update_failed',
  'Invalid action': 'invalid_action',
  'Invalid amount': 'invalid_amount',
  'Please add your IBAN in your profile first': 'iban_required',
  'Insufficient balance': 'insufficient_balance',
  'You already have a pending withdrawal request': 'pending_withdrawal_exists',
  'Failed to create withdrawal request': 'withdrawal_create_failed',
  'Provider account is not active': 'provider_account_inactive',
  'Failed to submit edit request': 'trip_edit_request_failed',
  'Failed to update trip': 'trip_update_failed',
  'Only buyers can apply to become marketeers': 'marketeer_only_buyers',
  'You already have a pending or approved application': 'marketeer_application_exists',
  'Failed to submit application': 'application_submit_failed',
  'Not a marketeer': 'marketeer_required',
  'No file provided': 'file_required',
  'No images provided': 'images_required',
  'File must have a header row and at least one data row': 'import_file_invalid',
  'Failed to process image': 'image_process_failed',
  'Subject, title, and bookingUrl are required': 'campaign_required_fields',
  'No customers with email addresses': 'campaign_no_customers',
  'Failed to generate referral code': 'referral_code_generate_failed',
  'Failed to create marketeer profile': 'marketeer_profile_create_failed',
  'Failed to update user role': 'user_role_update_failed',
  'Rejection comment is required': 'rejection_comment_required',
  'Only providers can create cars': 'provider_only_cars',
  'Failed to create car': 'car_create_failed',
  'Failed to update car': 'car_update_failed',
  'Car not found': 'car_not_found',
}

const ARABIC_REGEX = /[\u0600-\u06FF]/

export function resolveApiErrorMessage(
  error: string | null | undefined,
  t: (key: string) => string,
  fallbackKey = 'generic'
) {
  if (!error) return t(fallbackKey)

  const mappedKey = API_ERROR_KEY_MAP[error]
  if (mappedKey) return t(mappedKey)

  if (ARABIC_REGEX.test(error)) return error

  return t(fallbackKey)
}
