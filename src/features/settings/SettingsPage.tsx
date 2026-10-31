import { useState } from 'react'
import { PageHeader } from '../../app/PageHeader'
import { useTheme, type ThemePref } from '../../app/theme'
import { Segmented } from '../../components/Segmented'
import { Stepper } from '../../components/Stepper'
import { Switch } from '../../components/Switch'
import { db, DEFAULT_SETTINGS } from '../../data/db'
import { resetDemoData } from '../../data/seed'
import type { Settings } from '../../data/types'
import { useLiveQuery } from '../../data/useLiveQuery'
import { seconds } from '../player/format'
import dialog from '../player/Dialog.module.css'
import { useModal } from '../player/useModal'
import styles from './SettingsPage.module.css'

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto' },
] as const satisfies readonly { value: ThemePref; label: string }[]

const save = (patch: Partial<Omit<Settings, 'id'>>) =>
  db.settings.put({ ...DEFAULT_SETTINGS, ...patch, id: 'settings' }).catch(console.error)

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const stored = useLiveQuery(() => db.settings.get('settings'))
  const settings = stored ?? DEFAULT_SETTINGS
  const update = (patch: Partial<Omit<Settings, 'id'>>) => save({ ...settings, ...patch })

  const [confirming, setConfirming] = useState(false)
  const [status, setStatus] = useState('')
  const modal = useModal(confirming)
  const reset = async () => {
    setConfirming(false)
    setStatus('Resetting…')
    try {
      await resetDemoData()
      setStatus('Demo data reset: fresh workouts, six weeks of sessions, default settings.')
    } catch (e) {
      console.error(e)
      setStatus('Could not reset the demo data. Reload the page and try again.')
    }
  }

  return (
    <>
      <PageHeader eyebrow="Stored on this device" title="Settings" />

      <section className={styles.group} aria-labelledby="settings-workout">
        <h2 id="settings-workout" className={styles.heading}>
          Workout
        </h2>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.text}>
              <span className={styles.label}>Default rest</span>
              <span className={styles.hint}>Between sets in Try it</span>
            </span>
            <Stepper
              label="Default rest"
              value={settings.defaultRest}
              min={0}
              max={180}
              step={15}
              format={seconds}
              onChange={(defaultRest) => update({ defaultRest })}
            />
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Weekly goal</span>
            <Stepper
              label="Weekly goal"
              value={settings.weeklyGoal}
              min={1}
              max={7}
              format={(n) => `${n} / wk`}
              onChange={(weeklyGoal) => update({ weeklyGoal })}
            />
          </div>
        </div>
      </section>

      <section className={styles.group} aria-labelledby="settings-session">
        <h2 id="settings-session" className={styles.heading}>
          During a session
        </h2>
        <div className={styles.card}>
          <div className={styles.row}>
            <span id="settings-wake" className={styles.label}>
              Keep screen awake
            </span>
            <Switch
              labelledBy="settings-wake"
              checked={settings.wakeLock}
              onChange={(wakeLock) => update({ wakeLock })}
            />
          </div>
          <div className={styles.row}>
            <span id="settings-beeps" className={styles.label}>
              Beeps · 3-2-1
            </span>
            <Switch
              labelledBy="settings-beeps"
              checked={settings.beeps}
              onChange={(beeps) => update({ beeps })}
            />
          </div>
        </div>
      </section>

      <section className={styles.group} aria-labelledby="settings-appearance">
        <h2 id="settings-appearance" className={styles.heading}>
          Appearance
        </h2>
        <Segmented label="Appearance" options={THEME_OPTIONS} value={theme} onChange={setTheme} />
      </section>

      <section className={styles.group} aria-labelledby="settings-data">
        <h2 id="settings-data" className={styles.heading}>
          Data
        </h2>
        <div className={styles.card}>
          <button type="button" className={styles.danger} onClick={() => setConfirming(true)}>
            Reset demo data
          </button>
        </div>
        <p className={styles.status} role="status">
          {status}
        </p>
      </section>

      <dialog
        ref={modal}
        className={dialog.dialog}
        aria-labelledby="reset-title"
        aria-describedby="reset-body"
        onCancel={(e) => {
          e.preventDefault()
          setConfirming(false)
        }}
      >
        <h2 id="reset-title" className={dialog.title}>
          Reset demo data?
        </h2>
        <p id="reset-body" className={dialog.body}>
          Your logged sessions and settings on this device are replaced with the demo: five workouts and six
          weeks of sessions. This can't be undone.
        </p>
        <div className={dialog.buttons}>
          <button type="button" className={dialog.secondary} onClick={() => setConfirming(false)} autoFocus>
            Cancel
          </button>
          <button type="button" className={styles.dangerButton} onClick={() => void reset()}>
            Reset
          </button>
        </div>
      </dialog>
    </>
  )
}
