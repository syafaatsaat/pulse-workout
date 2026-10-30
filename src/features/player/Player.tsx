import { useEffect, useReducer, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { finishSession, saveSets } from '../../data/sessions'
import type { Exercise } from '../../data/types'
import type { Step } from '../../engine/compile'
import { currentStep, initPlayer, playerReducer, remainingMs } from '../../engine/playerReducer'
import type { SetValue } from '../../engine/stats'
import { EndDialog } from './EndDialog'
import { FormDialog } from './FormDialog'
import styles from './Player.module.css'
import { RestView } from './RestView'
import { useNow } from './useNow'
import { WorkView } from './WorkView'

export interface PlayerProps {
  sessionId: string
  workoutName: string
  steps: Step[]
  moveCount: number
  exercises: Map<string, Exercise>
  lastTimes: Map<string, SetValue>
}

export function Player({ sessionId, steps, moveCount, exercises, lastTimes }: PlayerProps) {
  const [state, dispatch] = useReducer(playerReducer, steps, initPlayer)
  const [dialog, setDialog] = useState<'end' | 'form' | null>(null)
  const pausedForDialog = useRef(false)
  const navigate = useNavigate()
  const now = useNow(state.status === 'running')
  const step = currentStep(state)
  const remaining = remainingMs(state, now)

  // The Start tap happened on the previous screen: begin straight away.
  useEffect(() => dispatch({ type: 'start', now: Date.now() }), [])

  // Timers reaching zero: timed work completes itself, rest moves on.
  useEffect(() => {
    if (state.status !== 'running' || remaining !== 0 || !step) return
    dispatch(step.kind === 'rest' ? { type: 'skipRest', now } : { type: 'setDone', now })
  }, [state.status, remaining, step, now])

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
  const common = { state, step, now, moveCount, dispatch }

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
