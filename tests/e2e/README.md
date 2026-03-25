# E2E Testing

This project uses Playwright for production-oriented smoke tests.

## Install browsers

```bash
pnpm exec playwright install
```

## Local run

Playwright will start the Next.js dev server automatically on port `3001`.

```bash
pnpm test:e2e
```

## Staging or production-like run

Set a base URL and seeded role credentials:

```bash
E2E_BASE_URL=https://staging.example.com \
E2E_LOCALE=en \
E2E_BUYER_EMAIL=buyer@example.com \
E2E_BUYER_PASSWORD=secret \
E2E_ADMIN_EMAIL=admin@example.com \
E2E_ADMIN_PASSWORD=secret \
E2E_MARKETEER_EMAIL=marketeer@example.com \
E2E_MARKETEER_PASSWORD=secret \
PLAYWRIGHT_USE_EXISTING_SERVER=1 \
pnpm test:e2e
```

## What the smoke suite covers

- Public marketeer landing page renders
- Referral route redirects safely
- Buyer can open the marketeer entry flow
- Admin can open marketeer review page
- Approved marketeer can open dashboard

These are safe smoke tests. They validate access, routing, and page stability without mutating production data.

## Mutation test for the full flow

There is also an opt-in mutation test for:

- buyer submits a marketeer application
- admin approves it
- applicant reaches the marketeer dashboard

Enable it only on a resettable staging environment:

```bash
E2E_ENABLE_MUTATION_TESTS=1 \
E2E_BASE_URL=https://staging.example.com \
E2E_LOCALE=en \
E2E_ADMIN_EMAIL=admin@example.com \
E2E_ADMIN_PASSWORD=secret \
E2E_APPLICANT_EMAIL=applicant@example.com \
E2E_APPLICANT_PASSWORD=secret \
pnpm test:e2e tests/e2e/marketeer.mutation.spec.ts
```

Important:

- Use a dedicated applicant account.
- The test is one-way if approval succeeds.
- For repeated runs, use a database reset or a fresh applicant account.
