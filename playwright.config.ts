import { defineConfig, devices } from '@playwright/test'

// E2E (REDESIGN §6): every route and player phase at 390×844 and 1440×900, light and dark.
// Runs against the production build; screenshots are attached to the HTML report
// (npx playwright show-report), not compared pixel by pixel, because the demo data is dated
// relative to today.
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
const desktop = { viewport: { width: 1440, height: 900 } }

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://localhost:4173', ...devices['Desktop Chrome'] },
  projects: [
    { name: 'phone-light', use: { ...devices['Desktop Chrome'], ...phone, colorScheme: 'light' } },
    { name: 'phone-dark', use: { ...devices['Desktop Chrome'], ...phone, colorScheme: 'dark' } },
    { name: 'desktop-light', use: { ...devices['Desktop Chrome'], ...desktop, colorScheme: 'light' } },
    { name: 'desktop-dark', use: { ...devices['Desktop Chrome'], ...desktop, colorScheme: 'dark' } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
