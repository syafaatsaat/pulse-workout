import type { Step } from '../../engine/compile'
import { stepCue } from './voice'

const step = (over: Partial<Step>): Step => ({
  kind: 'work',
  exerciseId: 'Pushups',
  setIndex: 0,
  setCount: 3,
  target: 10,
  durationMs: 30_000,
  mode: 'reps',
  blockId: 'a',
  phase: 'main',
  moveIndex: 0,
  ...over,
})

test('stepCue: Go on work, Get into position before a hold, Set done on rest and at the end', () => {
  expect(stepCue(step({}))).toBe('Go')
  expect(stepCue(step({ mode: 'time', needsSetup: true }))).toBe('Get into position')
  expect(stepCue(step({ kind: 'rest', mode: 'time' }))).toBe('Set done. Rest')
  expect(stepCue(undefined)).toBe('Set done')
})

describe('speech (iOS)', () => {
  const spoken: SpeechSynthesisUtterance[] = []
  const synth = { speaking: false, pending: false, speak: vi.fn((u) => spoken.push(u)), cancel: vi.fn() }

  beforeAll(() => {
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        volume = 1
        text: string
        constructor(text: string) {
          this.text = text
        }
      },
    )
  })
  afterAll(() => vi.unstubAllGlobals())

  test('unlockSpeech speaks one silent utterance, once', async () => {
    const { unlockSpeech } = await import('./voice')
    unlockSpeech()
    unlockSpeech()
    expect(spoken).toHaveLength(1)
    expect(spoken[0]!.volume).toBe(0)
  })

  test('speak only cancels when something is queued (iOS drops speech right after cancel)', async () => {
    const { speak } = await import('./voice')
    speak('Go')
    expect(synth.cancel).not.toHaveBeenCalled()
    synth.speaking = true
    speak('Set done. Rest')
    expect(synth.cancel).toHaveBeenCalledTimes(1)
    expect(spoken.map((u) => u.text).slice(-2)).toEqual(['Go', 'Set done. Rest'])
  })
})
