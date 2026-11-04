import { describe, expect, it } from 'vitest'
import { parseAuth } from './protocol'

describe('private Trainer Account authentication', () => {
  it('accepts properly shaped private session tokens', () => {
    const token = 'a'.repeat(64)
    expect(parseAuth({ kind: 'trainer', token })).toEqual({ kind: 'trainer', token })
  })

  it('rejects malformed and missing private session tokens', () => {
    expect(parseAuth({ kind: 'trainer', token: 'short' })).toBeNull()
    expect(parseAuth({ kind: 'trainer', token: 'z'.repeat(64) })).toBeNull()
    expect(parseAuth({ kind: 'trainer' })).toBeNull()
  })

  it('preserves upstream Clerk and guest authentication', () => {
    expect(parseAuth({ kind: 'clerk', token: 'session-token' })).toEqual({ kind: 'clerk', token: 'session-token' })
    expect(parseAuth({ kind: 'guest', id: 'A'.repeat(16) })).toEqual({ kind: 'guest', id: 'A'.repeat(16) })
  })
})
