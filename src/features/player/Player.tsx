import { useEffect, useReducer, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { db } from '../../data/db'
import { finishSession, saveSets } from '../../data/sessions'
import { useLiveQuery } from '../../data/useLiveQuery'
import type { Exercise, SessionSet } from '../../data/types'
import type { Step } from '../../engine/compile'
import {
  currentStep,
  initPlayer,
  playerReducer,
  remainingMs,
  restorePlayer,
  type PlayerAction,
} from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import { unlockAudio } from './audio'
import { EndDialog } from './EndDialog'
import { FormDialog } from './FormDialog'
import styles from './Player.module.css'
import { RestView } from './RestView'
import { useCues } from './useCues'
import { useNow } from './useNow'
import { useWakeLock } from './useWakeLock'
import { WorkView } from './WorkView'

export interface PlayerProps {
  sessionId: string
  /** Saved progress to restore; null for a fresh start from the Start tap. */
  session: { sets: SessionSet[]; startedAt: number; openedAt: number } | null
  workoutName: string
  steps: Step[]
  moveCount: number
  exercises: Map<string, Exercise>
  lastTimes: Map<string, SetValue>
}

export function Player({ sessionId, session, steps, moveCount, exercises, lastTimes }: PlayerProps) {
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

  useEffect(() => {
    if (status !== 'finished' || endedAt === null) return
    finishSession(sessionId, sets, endedAt)
      .then((result) =>
        navigate(result === 'saved' ? `/session/${sessionId}/summary` : '/', { replace: true }),
      )
      .catch(console.error)
  }, [status, endedAt, sessionId, sets, navigate])

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

  if (!step) return <div className={styles.player} data-mode="work" />

  const exercise = exercises.get(step.exerciseId)
  const next = state.steps[state.index + 1]
  const common = { state, step, now, moveCount, dispatch, notice }

  return (
    <>
      {step.kind === 'rest' ? (
        <RestView
          {...common}
          onEnd={openEnd}
          next={next}
          nextExercise={next && exercises.get(next.exerciseId)}
        />
      ) : (
        <WorkView
          {...common}
          onEnd={openEnd}
          exercise={exercise}
          next={next}
          nextExercise={next && exercises.get(next.exerciseId)}
          last={lastTimes.get(step.exerciseId)}
          onForm={() => setDialog('form')}
        />
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
