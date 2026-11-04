import { describe, expect, it } from 'vitest'
import { parseTickEntry } from './lockstep'

describe('authenticated co-op admin spawn event validation', () => {
  it('accepts a valid relay-generated enemy spawn within limits', () => {
    expect(parseTickEntry({ slot: 0, kind: 'adminSpawn', enemy: 'zubat', count: 2 }, 2)).toEqual({
      slot: 0, kind: 'adminSpawn', enemy: 'zubat', count: 2,
    })
  })

  it('rejects unknown enemies, invalid count, and nonexistent run slots', () => {
    expect(parseTickEntry({ slot: 0, kind: 'adminSpawn', enemy: 'missing', count: 1 }, 2)).toBeNull()
    expect(parseTickEntry({ slot: 0, kind: 'adminSpawn', enemy: 'zubat', count: 0 }, 2)).toBeNull()
    expect(parseTickEntry({ slot: 0, kind: 'adminSpawn', enemy: 'zubat', count: 21 }, 2)).toBeNull()
    expect(parseTickEntry({ slot: 2, kind: 'adminSpawn', enemy: 'zubat', count: 1 }, 2)).toBeNull()
  })
})
