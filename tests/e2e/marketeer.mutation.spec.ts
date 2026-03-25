import { test, expect } from '@playwright/test'

import { loginAsRole, loginWithCredentials } from './helpers/auth'

const locale = process.env.E2E_LOCALE || 'en'
const mutationEnabled = process.env.E2E_ENABLE_MUTATION_TESTS === '1'

function applicantCreds() {
  const email = process.env.E2E_APPLICANT_EMAIL
  const password = process.env.E2E_APPLICANT_PASSWORD

  if (!email || !password) {
    return null
  }

  return { email, password }
}

function applicantProfile() {
  return {
    fullName: process.env.E2E_APPLICANT_FULL_NAME || 'Playwright Applicant',
    nationalId: process.env.E2E_APPLICANT_NATIONAL_ID || '1234567890',
    dateOfBirth: process.env.E2E_APPLICANT_DOB || '1995-01-01',
    phone: process.env.E2E_APPLICANT_PHONE || '0555555555',
    phoneAlt: process.env.E2E_APPLICANT_PHONE_ALT || '0555555556',
    address:
      process.env.E2E_APPLICANT_ADDRESS ||
      'Riyadh / Olaya / Building 10',
  }
}

test.describe('Marketeer flow mutations', () => {
  test('buyer applies and admin approves the application', async ({ browser }) => {
    test.skip(!mutationEnabled, 'Mutation tests are disabled')

    const creds = applicantCreds()
    test.skip(!creds, 'Missing applicant credentials')

    const applicant = await browser.newContext()
    const applicantPage = await applicant.newPage()

    await loginWithCredentials(applicantPage, creds)
    await applicantPage.goto(`/${locale}/become-marketeer/apply`)

    if (applicantPage.url().includes('/marketeer/dashboard')) {
      test.skip(true, 'Applicant is already approved; use a resettable applicant account')
    }

    if (applicantPage.url().includes('/become-marketeer/apply')) {
      const profile = applicantProfile()

      await applicantPage.getByTestId('marketeer-full_name').fill(profile.fullName)
      await applicantPage.getByTestId('marketeer-national_id').fill(profile.nationalId)
      await applicantPage.getByTestId('marketeer-date_of_birth').fill(profile.dateOfBirth)
      await applicantPage.getByTestId('marketeer-phone').fill(profile.phone)
      await applicantPage.getByTestId('marketeer-phone_alt').fill(profile.phoneAlt)
      await applicantPage.getByTestId('marketeer-email').fill(creds.email)
      await applicantPage.getByTestId('marketeer-national_address').fill(profile.address)
      await applicantPage.getByTestId('marketeer-apply-submit').click()
    }

    await expect(applicantPage).toHaveURL(new RegExp(`/${locale}/become-marketeer/status$`))
    await expect(applicantPage.getByTestId('marketeer-application-status')).toBeVisible()

    const admin = await browser.newContext()
    const adminPage = await admin.newPage()

    await loginAsRole(adminPage, 'admin')
    await adminPage.goto(`/${locale}/admin/marketeers?status=pending_review`)

    const row = adminPage
      .locator('tr[data-application-email]')
      .filter({ hasText: creds.email })
      .first()

    await expect(row).toBeVisible()

    const rowId = await row.getAttribute('data-testid')
    if (!rowId) {
      throw new Error('Could not resolve admin application row id')
    }

    const applicationId = rowId.replace('marketeer-application-row-', '')
    await adminPage.getByTestId(`approve-marketeer-${applicationId}`).click()

    await expect(row).toHaveCount(0)

    await applicantPage.goto(`/${locale}/marketeer/dashboard`)
    await expect(applicantPage).toHaveURL(new RegExp(`/${locale}/marketeer/dashboard$`))
    await expect(applicantPage.getByTestId('marketeer-dashboard-header')).toBeVisible()

    await applicant.close()
    await admin.close()
  })
})
