import { describe, expect, it } from 'vitest'
import { parseAuth } from '../net/protocol'

describe('private cloud trainer authentication wire format', () => {
  it('accepts correctly formatted session tokens', () => {
    const token = 'a'.repeat(64)
    expect(parseAuth({ kind: 'trainer', token })).toEqual({ kind: 'trainer', token })
  })
  it('rejects client-provided ids and malformed tokens', () => {
    expect(parseAuth({ kind: 'trainer', id: 'other-user' })).toBeNull()
    expect(parseAuth({ kind: 'trainer', token: 'short' })).toBeNull()
  })
})
