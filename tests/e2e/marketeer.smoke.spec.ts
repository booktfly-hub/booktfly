import { test, expect } from '@playwright/test'

import { hasRoleCreds, loginAsRole } from './helpers/auth'

const locale = process.env.E2E_LOCALE || 'en'

test.describe('Marketeer flow smoke', () => {
  test('public landing renders', async ({ page }) => {
    await page.goto(`/${locale}/become-marketeer`)

    await expect(page).toHaveURL(new RegExp(`/${locale}/become-marketeer$`))
    await expect(page.locator(`a[href='/${locale}/become-marketeer/apply']`).first()).toBeVisible()
  })

  test('referral route resolves without crashing', async ({ page }) => {
    await page.goto(`/${locale}/ref/INVALID-CODE`)

    await expect(page).toHaveURL(new RegExp(`/${locale}/trips$`))
  })

  test('buyer marketeer entry path loads', async ({ page }) => {
    test.skip(!hasRoleCreds('buyer'), 'Missing buyer E2E credentials')

    await loginAsRole(page, 'buyer')
    await page.goto(`/${locale}/become-marketeer/apply`)

    await expect(page).toHaveURL(
      new RegExp(`/${locale}/(become-marketeer/(apply|status)|marketeer/dashboard)$`)
    )
  })

  test('admin marketeer review page loads', async ({ page }) => {
    test.skip(!hasRoleCreds('admin'), 'Missing admin E2E credentials')

    await loginAsRole(page, 'admin')
    await page.goto(`/${locale}/admin/marketeers`)

    await expect(page).toHaveURL(new RegExp(`/${locale}/admin/marketeers`))
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('approved marketeer dashboard loads', async ({ page }) => {
    test.skip(!hasRoleCreds('marketeer'), 'Missing marketeer E2E credentials')

    await loginAsRole(page, 'marketeer')
    await page.goto(`/${locale}/marketeer/dashboard`)

    await expect(page).toHaveURL(new RegExp(`/${locale}/marketeer/dashboard$`))
    await expect(page.getByText(/referral link/i)).toBeVisible()
  })
})
