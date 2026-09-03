import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto('http://127.0.0.1:3000/bundles/discovery-set', { waitUntil: 'networkidle' })
const vialCount = await page.locator('.lumiere-discovery-sample').count()
const initialOpenCount = await page.locator('.lumiere-discovery-sample-wrap[open]').count()
const secondVial = page.locator('.lumiere-discovery-sample').nth(1)
await secondVial.click({ force: true })
await page.waitForTimeout(100)
const secondOpen = await page.locator('.lumiere-discovery-sample-wrap').nth(1).getAttribute('open')
const previewText = await page.locator('.lumiere-discovery-sample-wrap').nth(1).locator('.lumiere-discovery-note-popover').textContent()
await secondVial.focus()
const focusedLabel = await secondVial.getAttribute('aria-label')
console.log(JSON.stringify({ url: page.url(), vialCount, initialOpenCount, secondOpen: secondOpen !== null, previewText, focusedLabel, errors }, null, 2))
await browser.close()
