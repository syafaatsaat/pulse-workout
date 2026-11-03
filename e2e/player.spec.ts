import { expect, test, type Page, type TestInfo } from '@playwright/test'

// The player's four phases, reached through "Try it" (one move, 3 sets, 30 s rest):
// Pushups gives work (reps) and rest; Plank (needsSetup) gives get-into-position and the hold.

const infoButton = (page: Page) => page.getByRole('button', { name: /^Exercise info/ })
/** The video card: the ⓘ button sits directly inside it. */
const videoHeight = async (page: Page) => (await infoButton(page).locator('..').boundingBox())?.height ?? 0

async function tryIt(page: Page, exerciseId: string) {
  await page.goto(`/library/${exerciseId}`)
  await page.getByRole('button', { name: 'Try it' }).click()
  await expect(page).toHaveURL(/\/session\//)
  await expect(infoButton(page)).toBeVisible()
}

async function shoot(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' })
}

test('the video card is the same size in every phase', async ({ page }, testInfo) => {
  const heights: Record<string, number> = {}

  await tryIt(page, 'Pushups')
  await expect(page.getByRole('button', { name: 'One rep more' })).toBeVisible()
  heights.work = await videoHeight(page)
  await shoot(page, testInfo, 'work')

  await page.getByRole('button', { name: 'Set done' }).click()
  await expect(page.getByRole('button', { name: 'Skip rest' })).toBeVisible()
  await expect(page.getByText(/^Up next · /)).toBeVisible()
  heights.rest = await videoHeight(page)
  await shoot(page, testInfo, 'rest')

  await tryIt(page, 'Plank')
  await expect(page.getByRole('button', { name: 'Start now' })).toBeVisible()
  await expect(page.getByRole('timer', { name: /^Get into position/ })).toBeVisible()
  heights.ready = await videoHeight(page)
  await shoot(page, testInfo, 'get-ready')

  await page.getByRole('button', { name: 'Start now' }).click()
  await expect(page.getByRole('button', { name: 'Set done' })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText(/^\d\d:\d\d$/)
  heights.holding = await videoHeight(page)
  await shoot(page, testInfo, 'holding')

  expect(heights.work).toBeGreaterThan(200)
  expect(heights).toEqual({
    work: heights.work,
    rest: heights.work,
    ready: heights.work,
    holding: heights.work,
  })
})

test('the info sheet opens without pausing and gives focus back to ⓘ', async ({ page }, testInfo) => {
  await tryIt(page, 'Pushups')
  await infoButton(page).click()
  const sheet = page.getByRole('dialog', { name: 'Pushups' })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('heading', { name: 'How to do it' })).toBeVisible()
  await shoot(page, testInfo, 'info-sheet')

  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(infoButton(page)).toBeFocused()
  // Still running: the button offers Pause, not Resume.
  await expect(page.getByRole('button', { name: /^Pause/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Resume/ })).toHaveCount(0)
})
