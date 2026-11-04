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

/** The last cue spoken, until it ends. The silent unlock never counts. */
let current: SpeechSynthesisUtterance | null = null

/**
 * Speaks `text`, cutting off a cue still being said. Never cancels for the silent unlock: the
 * first "Go" comes straight after the Start tap, while it is still queued, and iOS drops an
 * utterance spoken right after cancel().
 */
export function speak(text: string): void {
  const s = synth()
  if (!s) return
  if (current && (s.speaking || s.pending)) s.cancel()
  const u = new SpeechSynthesisUtterance(text)
  current = u
  u.onend = u.onerror = () => {
    if (current === u) current = null
  }
  s.speak(u)
}
