import { chromium, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://localhost:3000'
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ ...devices['iPhone 13'] })
const page = await context.newPage()
const results = {}

await page.goto(`${baseURL}/r/LL-ML-KFVS?utm_source=qa&utm_medium=referral&utm_campaign=mobile`, { waitUntil: 'domcontentloaded' })
results.referralDestination = page.url()
results.simpleAccountAction = await page.getByRole('link', { name: /create your partner account/i }).isVisible()
results.shippingHiddenOnReferralEntry = !(await page.getByText(/where should we send your perfumes/i).isVisible().catch(() => false))
results.noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

await page.goto(`${baseURL}/partners/activate`, { waitUntil: 'domcontentloaded' })
results.activationUnauthenticatedRedirect = page.url()
results.activationProtected = /\/login\?next=%2Fpartners%2Factivate/.test(page.url())

console.log(JSON.stringify(results, null, 2))
await browser.close()
if (!results.simpleAccountAction || !results.shippingHiddenOnReferralEntry || !results.noHorizontalOverflow || !results.activationProtected) process.exit(1)
