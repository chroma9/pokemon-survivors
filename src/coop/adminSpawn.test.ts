import { describe, expect, it } from 'vitest'
import { toTickEntry } from './entries'

const slots = new Map([[7, 0], [12, 1]])

describe('admin spawn lockstep entries', () => {
  it('decodes a relay-stamped Chansey group into the matching player slot', () => {
    expect(toTickEntry([12, 'adminSpawn', 'chansey', 10], slots)).toEqual({ slot: 1, kind: 'adminSpawn', enemy: 'chansey', count: 10 })
  })

  it('ignores invalid enemy names and counts outside the safe range', () => {
    expect(toTickEntry([12, 'adminSpawn', 'nonexistent', 10], slots)).toBeNull()
    expect(toTickEntry([12, 'adminSpawn', 'chansey', 0], slots)).toBeNull()
    expect(toTickEntry([12, 'adminSpawn', 'chansey', 21], slots)).toBeNull()
    expect(toTickEntry([12, 'adminSpawn', 'chansey', 2.5], slots)).toBeNull()
  })
})
