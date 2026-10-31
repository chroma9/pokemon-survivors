import { DurableObject } from 'cloudflare:workers'
import type { Env } from './env'

type User = { id: string; handle: string; name: string; salt: string; verifier: string; created: number }
type Session = { id: string; expires: number }
const encoder = new TextEncoder()
const hex = (a: Uint8Array) => [...a].map((n) => n.toString(16).padStart(2, '0')).join('')
const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n))
const digest = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))))
const derive = async (pass: string, salt: string) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pass), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', iterations: 210000, salt: encoder.encode(salt) }, key, 256)
  return hex(new Uint8Array(bits))
}
const clean = (v: unknown) => typeof v === 'string' ? v.trim() : ''
const handleOf = (v: unknown) => /^[a-z0-9_]{3,20}$/.test(clean(v).toLowerCase()) ? clean(v).toLowerCase() : null
const publicProfile = (u: User) => ({ id: u.id, handle: u.handle, name: u.name, created: u.created })
const expiresIn = 30 * 24 * 3600 * 1000

/** Single global account directory. All credentials and session hashes remain within this Durable Object. */
export class TrainerAccounts extends DurableObject<Env> {
  async register(handleInput: unknown, passInput: unknown, nameInput: unknown) {
    const handle = handleOf(handleInput)
    const pass = clean(passInput)
    const name = clean(nameInput).slice(0, 24)
    if (!handle || pass.length < 12 || pass.length > 128 || name.length < 1) return { error: 'invalid' }
    if (await this.ctx.storage.get('name:' + handle)) return { error: 'taken' }
    const id = crypto.randomUUID()
    const salt = hex(bytes(16))
    const u: User = { id, handle, name, salt, verifier: await derive(pass, salt), created: Date.now() }
    await this.ctx.storage.put({ ['user:' + id]: u, ['name:' + handle]: id })
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
  async logout(token: string) {
    if (/^[0-9a-f]{64}$/.test(token)) await this.ctx.storage.delete('session:' + await digest(token))
  }
}
