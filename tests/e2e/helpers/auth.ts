import { expect, type Page } from '@playwright/test'

type Role = 'buyer' | 'admin' | 'marketeer'

const locale = process.env.E2E_LOCALE || 'en'

function credsFor(role: Role) {
  const upper = role.toUpperCase()
  const email = process.env[`E2E_${upper}_EMAIL`]
  const password = process.env[`E2E_${upper}_PASSWORD`]

  if (!email || !password) {
    return null
  }

  return { email, password }
}

export function hasRoleCreds(role: Role) {
  return !!credsFor(role)
}

export async function loginWithCredentials(
  page: Page,
  creds: { email: string; password: string }
) {
  await page.goto(`/${locale}/auth/login`)
  await page.locator('#email').fill(creds.email)
  await page.locator('#password').fill(creds.password)
  await page.locator('button[type="submit"]').first().click()

  await expect(page).not.toHaveURL(new RegExp(`/${locale}/auth/login$`))
}

export async function loginAsRole(page: Page, role: Role) {
  const creds = credsFor(role)

  if (!creds) {
    throw new Error(`Missing E2E credentials for role: ${role}`)
  }

  await loginWithCredentials(page, creds)
}
