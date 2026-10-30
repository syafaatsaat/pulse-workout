import { scheduleCountdown, type ToneContext } from './audio'

function fakeContext(currentTime: number) {
  const tones: { at: number; freq: number; stopped: boolean }[] = []
  const ctx: ToneContext = {
    currentTime,
    destination: {} as AudioDestinationNode,
    createOscillator: () => {
      const tone = { at: -1, freq: 0, stopped: false }
      tones.push(tone)
      return {
        frequency: {
          set value(v: number) {
            tone.freq = v
          },
        },
        connect: () => undefined,
        start: (at: number) => {
          tone.at = at
        },
        stop: (at?: number) => {
          if (at === undefined) tone.stopped = true
        },
      } as unknown as OscillatorNode
    },
    createGain: () =>
      ({
        gain: {
          setValueAtTime: () => undefined,
          linearRampToValueAtTime: () => undefined,
          exponentialRampToValueAtTime: () => undefined,
        },
        connect: () => undefined,
      }) as unknown as GainNode,
  }
  return { ctx, tones }
}

test('schedules 3-2-1 and a higher go beep against the audio clock', () => {
  const { ctx, tones } = fakeContext(100)
  scheduleCountdown(ctx, 30_000, 0) // zero is 30 s away
  expect(tones.map((t) => t.at)).toEqual([127, 128, 129, 130])
  expect(tones[3]!.freq).toBeGreaterThan(tones[0]!.freq)
})

test('skips beeps already in the past', () => {
  const { ctx, tones } = fakeContext(100)
  scheduleCountdown(ctx, 1_500, 0)
  expect(tones.map((t) => t.at)).toEqual([100.5, 101.5])
})

test('cancel stops only beeps that have not started', () => {
  const { ctx, tones } = fakeContext(100)
  const cancel = scheduleCountdown(ctx, 2_500, 0) // beeps at 100.5, 101.5, 102.5
  ;(ctx as { currentTime: number }).currentTime = 101.6
  cancel()
  expect(tones.map((t) => t.stopped)).toEqual([false, false, true])
})
