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

test('voice cues say "Go" as the first set starts, not just on later ones', async ({ page }) => {
  // Record speech instead of playing it.
  await page.addInitScript(() => {
    const spoken: string[] = []
    Object.assign(window, { spoken })
    class Utterance {
      text: string
      volume = 1
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor(text: string) {
        this.text = text
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance })
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speaking: false, pending: false, speak: (u: Utterance) => spoken.push(u.text), cancel() {} },
    })
  })
  const spoken = () => page.evaluate(() => (window as unknown as { spoken: string[] }).spoken)

  await page.goto('/settings')
  const voice = page.getByRole('switch', { name: 'Voice cues' })
  await voice.click()
  await expect.poll(spoken).toContain('Voice cues on')
  // The switch shows the stored value: checked means the setting is saved before we leave.
  await expect(voice).toBeChecked()

  await tryIt(page, 'Pushups')
  await expect.poll(spoken).toEqual([' ', 'Go']) // the silent iOS unlock, then the cue
})

/** A one-finger drag on `selector` from y to y + dy, over `ms`, as real touch events. */
async function swipe(page: Page, selector: string, dy: number, ms: number) {
  await page.evaluate(
    async ({ selector, dy, ms }) => {
      const el = document.querySelector(selector)!
      const box = el.getBoundingClientRect()
      const x = box.left + box.width / 2
      const y0 = box.top + 40
      const touch = (y: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y })
      const fire = (type: string, y: number) => {
        const t = touch(y)
        el.dispatchEvent(
          new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: type === 'touchend' ? [] : [t],
            changedTouches: [t],
          }),
        )
      }
      fire('touchstart', y0)
      const steps = 8
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, ms / steps))
        fire('touchmove', y0 + (dy * i) / steps)
      }
      fire('touchend', y0 + dy)
    },
    { selector, dy, ms },
  )
}

test('phone: swiping the info sheet down closes it; a small drag springs back', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The desktop panel has no drag handle')
  await tryIt(page, 'Pushups')
  // No pull-to-refresh while the player is open.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe(
    'none',
  )

  await infoButton(page).click()
  const sheet = page.getByRole('dialog', { name: 'Pushups' })
  await expect(sheet).toBeVisible()

  await swipe(page, 'dialog[open]', 30, 400)
  await page.waitForTimeout(300)
  await expect(sheet).toBeVisible()

  await swipe(page, 'dialog[open]', 220, 300)
  await expect(sheet).toBeHidden()
  await expect(infoButton(page)).toBeFocused()

  // Other pages keep the browser's normal pull behaviour.
  await page.goto('/')
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overscrollBehaviorY)).toBe(
    'auto',
  )
})
