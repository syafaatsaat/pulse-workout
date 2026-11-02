import { useEffect, useReducer, useRef, useState } from 'react'
import { useMediaQuery } from '../../app/useMediaQuery'
import { useLocation, useNavigate } from 'react-router'
import { db } from '../../data/db'
import { finishSession, saveSets } from '../../data/sessions'
import { useLiveQuery } from '../../data/useLiveQuery'
import type { Exercise, SessionSet } from '../../data/types'
import type { Step } from '../../engine/compile'
import {
  currentStep,
  elapsedMs,
  initPlayer,
  playerReducer,
  remainingMs,
  restorePlayer,
  type PlayerAction,
} from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import { unlockAudio } from './audio'
import { DesktopView } from './DesktopView'
import { EndDialog } from './EndDialog'
import { FormDialog } from './FormDialog'
import { PhoneView } from './PhoneView'
import styles from './Player.module.css'
import { playerScreen, runAdjust, runPrimary } from './screen'
import { useCues } from './useCues'
import { useNow } from './useNow'
import { useWakeLock } from './useWakeLock'

export interface PlayerProps {
  sessionId: string
  /** Saved progress to restore; null for a fresh start from the Start tap. */
  session: { sets: SessionSet[]; startedAt: number; openedAt: number } | null
  workoutName: string
  /** Labels under the desktop session bar. */
  blocks: { blockId: string; label: string }[]
  steps: Step[]
  moveCount: number
  exercises: Map<string, Exercise>
  lastTimes: Map<string, SetValue>
}

export function Player(props: PlayerProps) {
  const { sessionId, session, workoutName, blocks, steps, moveCount, exercises, lastTimes } = props
  const [state, rawDispatch] = useReducer(playerReducer, null, () =>
    session ? restorePlayer(steps, session.sets, session.startedAt, session.openedAt) : initPlayer(steps),
  )
  const location = useLocation()
  const settings = useLiveQuery(() => db.settings.get('settings'))

  // Starting or resuming is a user gesture: the moment iOS lets audio unlock.
  const dispatch = (action: PlayerAction) => {
    if (action.type === 'start' || action.type === 'resume') unlockAudio()
    rawDispatch(action)
  }
  const [dialog, setDialog] = useState<'end' | 'form' | null>(null)
  const pausedForDialog = useRef(false)
  const navigate = useNavigate()
  const now = useNow(state.status === 'running')
  const step = currentStep(state)
  const remaining = remainingMs(state, now)

  // Fresh start: the Start tap happened on the previous screen, so begin straight away, then drop
  // the flag so a reload restores instead of starting over. (The reducer ignores a second start.)
  const fresh = session === null
  useEffect(() => {
    if (!fresh) return
    rawDispatch({ type: 'start', now: Date.now() })
    navigate(location.pathname, { replace: true, state: null })
  }, [fresh, navigate, location.pathname])

  // Timers reaching zero: timed work completes itself, rest moves on — at endsAt exactly, so a
  // late frame (or a backgrounded tab) doesn't push the rest of the timeline back.
  const { endsAt } = state
  useEffect(() => {
    if (state.status !== 'running' || remaining !== 0 || !step || endsAt === null) return
    rawDispatch(step.kind === 'rest' ? { type: 'skipRest', now: endsAt } : { type: 'setDone', now: endsAt })
  }, [state.status, remaining, step, endsAt])

  useCues(state, settings?.beeps ?? true)
  const wakeLock = useWakeLock((settings?.wakeLock ?? true) && state.status !== 'finished')
  const notice = wakeLock === 'unavailable' ? "Screen may sleep: this browser can't keep it awake" : undefined

  // Save every completed set immediately.
  const { sets, startedAt, status, endedAt } = state
  useEffect(() => {
    if (sets.length > 0 && startedAt !== null) saveSets(sessionId, sets, startedAt).catch(console.error)
  }, [sessionId, sets, startedAt])

  // Once finished, elapsed is frozen at endedAt: the active time, pauses excluded.
  const active = elapsedMs(state, 0)
  useEffect(() => {
    if (status !== 'finished' || endedAt === null) return
    finishSession(sessionId, sets, endedAt, active)
      .then((result) =>
        result === 'saved'
          ? navigate(`/session/${sessionId}/summary`, { replace: true, state: { justFinished: true } })
          : navigate('/', { replace: true }),
      )
      .catch(console.error)
  }, [status, endedAt, active, sessionId, sets, navigate])

  // Confirming an end pauses the clock; "Keep going" resumes it.
  const openEnd = () => {
    pausedForDialog.current = state.status === 'running'
    if (pausedForDialog.current) dispatch({ type: 'pause', now: Date.now() })
    setDialog('end')
  }

  const closeEnd = () => {
    setDialog(null)
    if (pausedForDialog.current) dispatch({ type: 'resume', now: Date.now() })
    pausedForDialog.current = false
  }

  // Keyboard (desktop player): Space = set done / skip rest / start now (resume when paused),
  // P = pause, ← → = − / + (a rep, or 15 s on a rest or a hold), Esc = end. Off while a dialog is open; it handles its own keys.
  const onKey = useRef<(e: KeyboardEvent) => void>(undefined)
  useEffect(() => {
    onKey.current = (e) => {
      if (dialog || !step || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
      const paused = state.status === 'paused'
      const now = Date.now()
      const screen = playerScreen(state, step, now, moveCount, exercises, lastTimes)
      switch (e.key) {
        case ' ':
          e.preventDefault() // also stops a focused button from clicking a second time
          if (!e.repeat) runPrimary(screen.primary, dispatch)
          break
        case 'p':
        case 'P':
          if (!e.repeat) dispatch({ type: paused ? 'resume' : 'pause', now })
          break
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault()
          runAdjust(screen.adjust, e.key === 'ArrowLeft' ? -1 : 1, dispatch)
          break
        case 'Escape':
          // Without this the same key press's default "close request" cancels the dialog it opens.
          e.preventDefault()
          openEnd()
          break
      }
    }
  })
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey.current?.(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  const desktop = useMediaQuery('(min-width: 1024px)')

  if (!step) return <div className={styles.player} data-mode="work" />

  const exercise = exercises.get(step.exerciseId)
  const screen = playerScreen(state, step, now, moveCount, exercises, lastTimes)
  const common = { state, screen, dispatch, notice, onEnd: openEnd, onForm: () => setDialog('form') }

  return (
    <>
      {desktop ? (
        <DesktopView {...common} workoutName={workoutName} blocks={blocks} exercises={exercises} />
      ) : (
        <PhoneView {...common} />
      )}
      <EndDialog
        open={dialog === 'end'}
        setsDone={state.sets.length}
        onCancel={closeEnd}
        onConfirm={() => {
          setDialog(null)
          dispatch({ type: 'end', now: Date.now() })
        }}
      />
      <FormDialog open={dialog === 'form'} exercise={exercise} onClose={() => setDialog(null)} />
    </>
  )
}
