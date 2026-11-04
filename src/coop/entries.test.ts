import { describe, expect, it } from 'vitest'
import type { Entry } from '../net/protocol'
import { inputValues, toTickEntry, type Input } from './entries'

// Seat 3 plays slot 1 of a two-slot run (the slot bound, `parseTickEntry`, counts the run's slots).
const slots = new Map([[0, 0], [3, 1]])
const stamped = (i: Input, nonce = 0): Entry => [3, i.k, ...inputValues(i, nonce)]

describe('private co-op admin events', () => {
  it('converts authorized relay-stamped spawns into deterministic tick entries', () => {
    expect(toTickEntry([3, 'adminSpawn', 'voltorb', 3], slots)).toEqual({ slot: 1, kind: 'adminSpawn', enemy: 'voltorb', count: 3 })
  })

  it('rejects invalid enemy ids, excessive counts, and unknown seats', () => {
    expect(toTickEntry([3, 'adminSpawn', 'not_a_pokemon', 1], slots)).toBeNull()
    expect(toTickEntry([3, 'adminSpawn', 'voltorb', 21], slots)).toBeNull()
    expect(toTickEntry([7, 'adminSpawn', 'voltorb', 1], slots)).toBeNull()
  })
})

describe('Arena kit entries on the wire', () => {
  it('turn an aimed cast, a lock and a priority back into the tick entries sent', () => {
    expect(toTickEntry(stamped({ k: 'cast', skill: 1, dir: 96, reach: 140, target: 57, sample: 812 }), slots)).toEqual({ slot: 1, kind: 'cast', skill: 1, dir: 96, reach: 140, target: 57 })
    expect(toTickEntry(stamped({ k: 'lock', target: -1 }, 9), slots)).toEqual({ slot: 1, kind: 'lock', target: -1 })
    expect(toTickEntry(stamped({ k: 'prio', prio: 2 }, 9), slots)).toEqual({ slot: 1, kind: 'prio', prio: 2 })
  })

  it('drop a cast whose values a client made up', () => {
    expect(toTickEntry([3, 'cast', 0, 400, 10, -1, 1], slots)).toBeNull()
    expect(toTickEntry([3, 'cast', '0', 4, 10, -1, 1], slots)).toBeNull()
  })
})
