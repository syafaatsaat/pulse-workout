import { THEME_KEY, useTheme } from './theme'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

test('light and dark set data-theme and persist', () => {
  useTheme.getState().setTheme('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  useTheme.getState().setTheme('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('auto removes data-theme and the stored value', () => {
  useTheme.getState().setTheme('dark')
  useTheme.getState().setTheme('auto')
  expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  expect(localStorage.getItem(THEME_KEY)).toBeNull()
  expect(useTheme.getState().theme).toBe('auto')
})
