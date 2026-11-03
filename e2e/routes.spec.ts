import { expect, test } from '@playwright/test'

const ROUTES = [
  { name: 'today', path: '/', heading: /^Good (morning|afternoon|evening)$/ },
  { name: 'library', path: '/library', heading: 'Library' },
  { name: 'detail', path: '/library/Pushups', heading: 'Pushups' },
  { name: 'progress', path: '/progress', heading: 'Progress' },
  { name: 'settings', path: '/settings', heading: 'Settings' },
  { name: 'summary', path: '/session/demo-1/summary', heading: 'Session complete' },
]

for (const route of ROUTES) {
  test(`${route.name} renders without sideways scrolling`, async ({ page }, testInfo) => {
    await page.goto(route.path)
    // The Library desktop pane shows the name as an h2; every other screen has it as the h1.
    await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await testInfo.attach(route.name, { body: await page.screenshot(), contentType: 'image/png' })
  })
}

test('the old /log URL lands on Progress and keeps the month', async ({ page }) => {
  await page.goto('/log?month=2026-09')
  await expect(page).toHaveURL(/\/progress\?month=2026-09$/)
  await expect(page.getByRole('heading', { name: 'September 2026' })).toBeVisible()
})
