import { DurableObject } from 'cloudflare:workers'
import type { Env } from './env'
// Keep Worker-only referral definitions independent of browser game modules.
// These mirror src/game/referral.ts; verify both when changing rewards.
type ReferralContent =
  | { kind: 'egg'; tier: 'friend' | 'ultra' }
  | { kind: 'title'; title: 'ambassador' }
  | { kind: 'style'; style: { slot: 'frame'; id: 'ambassador' } }
  | { kind: 'shinyHatch'; family: 'dratini' }
type ReferralGift = {
  id: string
  content: ReferralContent
  reason: { kind: 'welcome'; from: string | null } | { kind: 'friends'; count: number }
}
const REFERRAL = { runs: 3 } as const
const WELCOME_GIFT: ReferralContent = { kind: 'egg', tier: 'friend' }
const FRIEND_MILESTONES: ReadonlyArray<{ friends: number; gifts: readonly ReferralContent[] }> = [
  { friends: 1, gifts: [{ kind: 'egg', tier: 'friend' }] },
  { friends: 3, gifts: [{ kind: 'title', title: 'ambassador' }, { kind: 'style', style: { slot: 'frame', id: 'ambassador' } }] },
  { friends: 5, gifts: [{ kind: 'egg', tier: 'ultra' }] },
  { friends: 10, gifts: [{ kind: 'shinyHatch', family: 'dratini' }] },
]

type User = { id: string; handle: string; name: string; salt: string; verifier: string; created: number; referredBy?: string | null; referralRuns?: number; referralCounted?: boolean }
type Session = { id: string; expires: number }
const encoder = new TextEncoder()
const hex = (a: Uint8Array) => [...a].map((n) => n.toString(16).padStart(2, '0')).join('')
const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n))
const digest = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
const derive = async (pass: string, salt: string) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pass), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 100000, salt: encoder.encode(salt) }, key, 256)
  return hex(new Uint8Array(bits))
}
const clean = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const handleOf = (v: unknown) => /^[a-z0-9_]{3,20}$/.test(clean(v).toLowerCase()) ? clean(v).toLowerCase() : null
const publicProfile = (u: User) => ({ id: u.id, handle: u.handle, name: u.name, created: u.created })
const expiresIn = 30 * 24 * 3600 * 1000

/** Single global account directory. All credentials and session hashes remain within this Durable Object. */
export class TrainerAccounts extends DurableObject<Env> {
  async register(handleInput: unknown, passInput: unknown, nameInput: unknown, inviterInput?: unknown) {
    const handle = handleOf(handleInput)
    const pass = clean(passInput)
    const name = clean(nameInput).slice(0, 24)
    if (!handle || pass.length < 12 || pass.length > 128 || name.length < 1) return { error: 'invalid' }
    if (await this.ctx.storage.get('name:' + handle)) return { error: 'taken' }
    const inviterHandle = handleOf(inviterInput)
    const inviterId = inviterHandle ? await this.ctx.storage.get<string>('name:' + inviterHandle) : null
    const id = crypto.randomUUID()
    const salt = hex(bytes(16))
    const u: User = { id, handle, name, salt, verifier: await derive(pass, salt), created: Date.now(), referredBy: inviterId ?? null, referralRuns: 0, referralCounted: false }
    await this.ctx.storage.put({ ['user:' + id]: u, ['name:' + handle]: id })
    if (inviterId) await this.ctx.storage.put('gift:' + id + ':welcome', { id: 'private-ref-welcome-' + id, content: WELCOME_GIFT, reason: { kind: 'welcome', from: inviterHandle } } satisfies ReferralGift)
    return this.issue(u)
  }
  async login(handleInput: unknown, passInput: unknown) {
    const handle = handleOf(handleInput)
    const pass = clean(passInput)
    if (!handle || !pass) return { error: 'invalid' }
    const id = await this.ctx.storage.get<string>('name:' + handle)
    const user = id ? await this.ctx.storage.get<User>('user:' + id) : null
    // Equalize credential verification work for missing accounts.
    const verifier = await derive(pass, user?.salt ?? 'unlisted-account-salt')
    if (!user || verifier !== user.verifier) return { error: 'invalid' }
    return this.issue(user)
  }
  private async issue(user: User) {
    const token = hex(bytes(32))
    await this.ctx.storage.put('session:' + await digest(token), { id: user.id, expires: Date.now() + expiresIn } satisfies Session)
    return { token, profile: publicProfile(user) }
  }
  async identify(token: string) {
    if (!/^[0-9a-f]{64}$/.test(token)) return null
    const key = 'session:' + await digest(token)
    const session = await this.ctx.storage.get<Session>(key)
    if (!session) return null
    if (session.expires <= Date.now()) { await this.ctx.storage.delete(key); return null }
    return await this.ctx.storage.get<User>('user:' + session.id) ?? null
  }
  async profile(handleInput: unknown) {
    const handle = handleOf(handleInput)
    const id = handle ? await this.ctx.storage.get<string>('name:' + handle) : null
    const user = id ? await this.ctx.storage.get<User>('user:' + id) : null
    return user ? publicProfile(user) : null
  }
  async update(token: string, nameInput: unknown) {
    const user = await this.identify(token)
    const name = clean(nameInput).slice(0, 24)
    if (!user || !name) return null
    const changed = { ...user, name }
    await this.ctx.storage.put('user:' + user.id, changed)
    return publicProfile(changed)
  }
  /** Private-fork referrals; the account, never localStorage, owns credit and gift IDs. */
  async referrals(token: string) {
    const user = await this.identify(token)
    if (!user) return null
    const all = await this.ctx.storage.list<User>({ prefix: 'user:' })
    const friends = [...all.values()].filter((u) => u.referredBy === user.id).map((u) => ({ handle: u.handle, name: u.name, runs: u.referralRuns ?? 0, counted: u.referralCounted === true }))
    return { handle: user.handle, link: '?ref=' + user.handle, friends, counted: friends.filter((u) => u.counted).length, milestones: FRIEND_MILESTONES.map((m) => ({ friends: m.friends, reached: friends.filter((u) => u.counted).length >= m.friends })) }
  }
  async gifts(token: string) {
    const user = await this.identify(token)
    if (!user) return null
    const gifts = await this.ctx.storage.list<ReferralGift>({ prefix: 'gift:' + user.id + ':' })
    return [...gifts.values()]
  }
  /**
   * A run submission is currently client-attested, not an authoritative match result.
   * Never use this endpoint for tradeable or paid rewards without server verification.
   */
  async referralRun(token: string, runId: unknown) {
    const user = await this.identify(token)
    if (!user) return { error: 'unauthorized' }
    if (typeof runId !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(runId)) return { error: 'invalid' }
    if (!user.referredBy || user.referralCounted) return { ok: true, counted: Boolean(user.referralCounted) }
    const key = 'run:' + user.id + ':' + runId
    if (await this.ctx.storage.get(key)) return { ok: true, counted: false }
    await this.ctx.storage.put(key, true)
    const runs = Math.min(REFERRAL.runs, (user.referralRuns ?? 0) + 1)
    const updated = { ...user, referralRuns: runs, referralCounted: runs >= REFERRAL.runs }
    await this.ctx.storage.put('user:' + user.id, updated)
    if (updated.referralCounted) {
      const all = await this.ctx.storage.list<User>({ prefix: 'user:' })
      const counted = [...all.values()].filter((u) => u.referredBy === user.referredBy && u.referralCounted).length
      for (const milestone of FRIEND_MILESTONES) {
        if (counted < milestone.friends) continue
        for (let i = 0; i < milestone.gifts.length; i++) {
          const content = milestone.gifts[i]
          if (!content) continue
          const giftId = 'private-ref-' + user.referredBy + '-' + milestone.friends + '-' + i
          await this.ctx.storage.put('gift:' + user.referredBy + ':' + milestone.friends + ':' + i, { id: giftId, content, reason: { kind: 'friends', count: milestone.friends } } satisfies ReferralGift)
        }
      }
    }
    return { ok: true, counted: updated.referralCounted, runs }
  }
  /** Optimistic revisioned cloud saves. No unverified client can replace another revision. */
  async readSave(token: string) {
    const user = await this.identify(token)
    if (!user) return null
    return await this.ctx.storage.get<{ revision: number; data: unknown; updated: number }>('save:' + user.id) ?? { revision: 0, data: null, updated: 0 }
  }
  async putSave(token: string, revision: unknown, data: unknown) {
    const user = await this.identify(token)
    if (!user) return { error: 'unauthorized' as const }
    if (!Number.isSafeInteger(revision) || (revision as number) < 0 || !data || typeof data !== 'object' || Array.isArray(data)) return { error: 'invalid' as const }
    const bytes = new TextEncoder().encode(JSON.stringify(data)).byteLength
    if (bytes > 262144) return { error: 'tooLarge' as const }
    const key = 'save:' + user.id
    const old = await this.ctx.storage.get<{ revision: number; data: unknown; updated: number }>(key)
    if ((old?.revision ?? 0) !== revision) return { error: 'conflict' as const, revision: old?.revision ?? 0 }
    const next = { revision: (revision as number) + 1, data, updated: Date.now() }
    await this.ctx.storage.put(key, next)
    // Preserve the previous revision for manual recovery from accidental corruption.
    if (old) await this.ctx.storage.put('save-backup:' + user.id, old)
    return { ok: true as const, revision: next.revision }
  }
  async logout(token: string) {
    if (/^[0-9a-f]{64}$/.test(token)) await this.ctx.storage.delete('session:' + await digest(token))
  }
}
