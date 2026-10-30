import { PageHeader } from '../../app/PageHeader'
import { useTheme, type ThemePref } from '../../app/theme'
import { Segmented } from '../../components/Segmented'
import styles from './SettingsPage.module.css'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
] as const satisfies readonly { value: ThemePref; label: string }[]

// Day 1: theme only. Full lean Settings arrives on Day 6.
export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  return (
    <>
      <PageHeader title="Settings" />
      <section className={styles.group}>
        <h2 className="eyebrow">Appearance</h2>
        <Segmented label="Appearance" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </section>
    </>
  )
}
