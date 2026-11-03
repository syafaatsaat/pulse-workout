import type { Step } from '../../engine/compile'
import type { Mock } from 'vitest'
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
  let spoken: SpeechSynthesisUtterance[]
  let synth: { speaking: boolean; pending: boolean; speak: Mock; cancel: Mock }

  // Fresh module per test: voice.ts keeps the unlocked flag and the current cue.
  beforeEach(() => {
    vi.resetModules()
    spoken = []
    synth = { speaking: false, pending: false, speak: vi.fn((u) => spoken.push(u)), cancel: vi.fn() }
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        volume = 1
        text: string
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(text: string) {
          this.text = text
        }
      },
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  test('unlockSpeech speaks one silent utterance, once', async () => {
    const { unlockSpeech } = await import('./voice')
    unlockSpeech()
    unlockSpeech()
    expect(spoken).toHaveLength(1)
    expect(spoken[0]!.volume).toBe(0)
  })

  test('the first cue never cancels the silent unlock still in the queue', async () => {
    const { speak, unlockSpeech } = await import('./voice')
    unlockSpeech()
    synth.speaking = true // the silent utterance hasn't finished
    speak('Go')
    expect(synth.cancel).not.toHaveBeenCalled()
    expect(spoken.map((u) => u.text)).toEqual([' ', 'Go'])
  })

  test('a new cue cuts off a cue still being said, but not one that has ended', async () => {
    const { speak } = await import('./voice')
    speak('Go')
    synth.speaking = true
    speak('Set done. Rest')
    expect(synth.cancel).toHaveBeenCalledTimes(1)
    spoken.at(-1)!.onend!(new Event('end') as SpeechSynthesisEvent)
    speak('Go')
    expect(synth.cancel).toHaveBeenCalledTimes(1)
  })
})
