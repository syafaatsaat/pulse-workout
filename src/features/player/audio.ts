// Web Audio cues. Side effects only — the reducer never touches this.
// iOS keeps audio locked until a user gesture, so unlockAudio() runs on the Start / Resume tap.

export type ToneContext = Pick<
  AudioContext,
  'currentTime' | 'destination' | 'createOscillator' | 'createGain'
>

let shared: AudioContext | null = null

export function unlockAudio(): void {
  const Ctor =
    window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return
  shared ??= new Ctor()
  if (shared.state === 'suspended') void shared.resume()
  // A silent one-sample buffer inside the gesture fully unlocks Safari.
  const source = shared.createBufferSource()
  source.buffer = shared.createBuffer(1, 1, 22_050)
  source.connect(shared.destination)
  source.start(0)
}

export function audioContext(): AudioContext | null {
  return shared?.state === 'running' ? shared : null
}

const TICK = { freq: 880, length: 0.12 }
const GO = { freq: 1320, length: 0.35 }

function tone(ctx: ToneContext, at: number, { freq, length }: { freq: number; length: number }) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.3, at + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(at)
  osc.stop(at + length + 0.05)
  return { osc, at }
}

/**
 * Beeps at 3, 2, 1 seconds before `endsAt` and a higher "go" at zero, scheduled on the audio clock
 * so they stay on time even if the page's frames are late. Returns a cancel that drops the beeps
 * that haven't started (a playing one finishes).
 */
export function scheduleCountdown(ctx: ToneContext, endsAt: number, now: number): () => void {
  const zero = ctx.currentTime + (endsAt - now) / 1000
  const tones = [3, 2, 1]
    .map((s) => zero - s)
    .filter((at) => at >= ctx.currentTime)
    .map((at) => tone(ctx, at, TICK))
  if (zero >= ctx.currentTime) tones.push(tone(ctx, zero, GO))
  return () => {
    for (const t of tones) if (t.at > ctx.currentTime) t.osc.stop()
  }
}
