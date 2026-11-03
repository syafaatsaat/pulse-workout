import type { Step } from '../../engine/compile'

// Voice cues (Settings → Voice cues): short spoken words as the session moves on. Side effects only.

/** What to say on entering `step`; `undefined` = the session just finished. */
export function stepCue(step: Step | undefined): string {
  if (!step) return 'Set done'
  if (step.kind === 'rest') return 'Set done. Rest'
  return step.needsSetup ? 'Get into position' : 'Go'
}

/** Speaks `text`, cutting off anything still being said. No-op without speech synthesis. */
export function speak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
}
