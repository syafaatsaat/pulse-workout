import { useNavigate } from 'react-router'
import { createSession } from '../../data/sessions'
import { unlockAudio } from './audio'

/** Start handler for any Start tap: unlocks audio inside the tap (iOS needs it), then opens the player. */
export function useStartWorkout() {
  const navigate = useNavigate()
  return async (workoutId: string) => {
    unlockAudio()
    navigate(`/session/${await createSession(workoutId)}`, { state: { start: true } })
  }
}
