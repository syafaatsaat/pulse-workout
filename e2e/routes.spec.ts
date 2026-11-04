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

test('the library renders the whole list, a chunk at a time', async ({ page }) => {
  await page.goto('/library')
  const kicker = page.getByText(/^\d+ exercises$/)
  await expect(kicker).toBeVisible()
  const total = Number((await kicker.textContent())!.split(' ')[0])
  await expect(page.locator('li > a[href^="/library/"]')).toHaveCount(total)
})

test('a deep link to an exercise far down the list selects it and scrolls it into view', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.startsWith('phone'), 'The two-pane list is desktop only')
  await page.goto('/library/Pushups')
  const row = page.getByRole('region', { name: 'Exercise list' }).locator('a[aria-current="page"]')
  await expect(row).toHaveAttribute('href', /\/library\/Pushups$/)
  await expect(row).toBeInViewport()
})
