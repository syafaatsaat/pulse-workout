import type { Step } from '../../engine/compile'

// Voice cues (Settings → Voice cues): short spoken words as the session moves on. Side effects only.

/** What to say on entering `step`; `undefined` = the session just finished. */
export function stepCue(step: Step | undefined): string {
  if (!step) return 'Set done'
  if (step.kind === 'rest') return 'Set done. Rest'
  return step.needsSetup ? 'Get into position' : 'Go'
}

const synth = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

let unlocked = false

/**
 * iOS Safari only speaks once speech has been started inside a tap; later cues come from timers
 * and effects, not taps. So, like unlockAudio(), this runs on the Start / Resume tap (and the
 * Voice cues switch): a silent utterance inside the gesture unlocks it for the session.
 */
export function unlockSpeech(): void {
  const s = synth()
  if (!s || unlocked) return
  const silent = new SpeechSynthesisUtterance(' ')
  silent.volume = 0
  s.speak(silent)
  unlocked = true
}

/** Speaks `text`, cutting off anything still being said. No-op without speech synthesis. */
export function speak(text: string): void {
  const s = synth()
  if (!s) return
  // Only cancel when something is queued: iOS can drop an utterance spoken right after cancel().
  if (s.speaking || s.pending) s.cancel()
  s.speak(new SpeechSynthesisUtterance(text))
}
