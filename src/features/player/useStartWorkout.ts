import { useNavigate } from 'react-router'
import { createSession } from '../../data/sessions'
import { unlockAudio } from './audio'
import { unlockSpeech } from './voice'

/** Start handler for any Start tap: unlocks audio and speech inside the tap (iOS needs it), then opens the player. */
export function useStartWorkout() {
  const navigate = useNavigate()
  return async (workoutId: string) => {
    unlockAudio()
    unlockSpeech()
    navigate(`/session/${await createSession(workoutId)}`, { state: { start: true } })
  }
}
