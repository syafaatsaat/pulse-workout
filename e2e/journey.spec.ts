import { expect, test } from '@playwright/test'

// BUILD_PLAN Day 7: start → finish → see it in Progress (was "Log").
test('start a workout, finish it, and find it in Progress', async ({ page }) => {
  // Try it on Pushups: one move, 3 sets with rests between.
  await page.goto('/library/Pushups')
  await page.getByRole('button', { name: 'Try it' }).click()
  await expect(page).toHaveURL(/\/session\/[^/]+$/)
  const sessionUrl = page.url()

  for (let set = 1; set <= 3; set++) {
    await page.getByRole('button', { name: 'Set done' }).click()
    if (set < 3) await page.getByRole('button', { name: 'Skip rest' }).click()
  }

  // The summary, straight after finishing.
  await expect(page).toHaveURL(`${sessionUrl}/summary`)
  await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible()
  await expect(page.getByText(/^Pushups · /)).toBeVisible()
  await page.getByRole('link', { name: 'Done' }).click()
  await expect(page).toHaveURL(/\/$/)

  // Progress: today is marked as logged, and opens this session's summary.
  await page.goto('/progress')
  const today = page.getByRole('link', { name: /, session logged, today$/ })
  await expect(today).toBeVisible()
  await today.click()
  await expect(page).toHaveURL(`${sessionUrl}/summary`)
  await expect(page.getByText(/^Pushups · /)).toBeVisible()
})
