import { PROTOCOL, parseRoomCode, type CreateResponse, type Region } from '../../src/net/protocol'
import { ENEMIES } from '../../src/data/enemies'
import { parseCreate } from './codes'
import type { Env } from './env'
import { allowedOrigin } from './origins'
import { HINT_HEADER, log, noSuchRoom, shardStub } from './shell'
import { SHARD_INDEXES, SHARD_REGIONS, shardName, shardOf, type Shard } from './shards'
import { EDGE_HEADER, edgeOf } from './telemetry'

export { Matchmaker } from './matchmakerObject'
export { ShardObject } from './shardObject'
export { Vault } from './vault'
export { TrainerAccounts } from './trainerAccounts'

/**
 * The relay's Worker: creates rooms in shards (`shards.ts`: many rooms per
 * Durable Object), routes each room's sockets to the shard its code names, and
 * serves `/health` and the admin dumps.
 *
 * - `POST /rooms` `{ v, build, region? }` → `{ code, region, claim }`
 * - `GET /rooms/<code>/ws` → WebSocket (first message: `hello`)
 * - `GET /arena/queue` → WebSocket to the Arena's matchmaker (`matchmakerObject.ts`; first message: `queue`)
 * - `GET /health`
 * - `GET /admin/dumps`, `GET /admin/dumps/<id>` (gzipped JSON), `GET /admin/shards/<region>:<index>` (its rooms and
 *   frame timer lateness), `Authorization: Bearer <ADMIN_TOKEN>`
 */

type Hint = Exclude<Region, 'auto'>

/**
 * The location hint nearest a request (its continent, and longitude in North
 * America). No Durable Object runs in South America (`sam` lands anywhere from
 * Miami to Chicago): from São Paulo the US east coast answers first (EWR
 * 116 ms, MIA 131 ms). Africa gets western Europe's: a room without a hint
 * shares the `auto` shards, which live wherever their first room was made.
 */
export const hintFor = (cf: { continent?: string; longitude?: string } | undefined): Hint | null => {
  switch (cf?.continent) {
    case 'SA':
      return 'enam'
    case 'NA':
      return Number(cf.longitude) < -100 ? 'wnam' : 'enam'
    case 'EU':
    case 'AF':
      return 'weur'
    case 'AS':
      return 'apac'
    case 'OC':
      return 'oc'
    default:
      return null
  }
}

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

const cors = (origin: string | null): Record<string, string> =>
  origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', Vary: 'Origin' } : {}

const ipOf = (request: Request) => request.headers.get('CF-Connecting-IP') ?? 'unknown'

const createRoom = async (request: Request<unknown, IncomingRequestCfProperties>, env: Env, headers: Record<string, string>): Promise<Response> => {
  const reply = (body: CreateResponse, status = 200) => json(body, status, headers)
  if (!(await env.CREATE_LIMIT.limit({ key: ipOf(request) })).success) return reply({ error: 'rate' }, 429)
  const body = parseCreate(await request.text())
  if ('error' in body) return reply({ error: body.error }, body.status)
  const { build, region: asked } = body
  const hint = asked === 'auto' ? hintFor(request.cf) : asked
  const region: Region = hint ?? 'auto'
  // The region's shards fill in order (packing only pays when rooms share an object): a full one says no, the next is asked.
  for (let index = 0; index < SHARD_INDEXES; index++) {
    const shard: Shard = { region, index }
    const made = await shardStub(env, shard)
      .create({ shard, build })
      .catch((err: unknown) => {
        log({ ev: 'shard.createFailed', shard: shardName(shard), error: String(err) })
        return null
      })
    if (made) return reply({ code: made.code, region, claim: made.claim })
  }
  return reply({ error: 'busy' }, 503)
}

/** Constant-time check of the admin bearer token. */
const isAdmin = async (request: Request, env: Env) => {
  const token = env.ADMIN_TOKEN
  const given = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
  if (!token || !given) return false
  const digest = async (s: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return crypto.subtle.timingSafeEqual(await digest(token), await digest(given))
}

const admin = async (request: Request, env: Env, path: string): Promise<Response> => {
  if (!(await isAdmin(request, env))) return new Response('Not found', { status: 404 })
  const shard = /^\/admin\/shards\/(\w+):(\d{1,2})$/.exec(path)
  if (shard) {
    const region = SHARD_REGIONS.find((r) => r === shard[1])
    const index = Number(shard[2])
    if (!region || index >= SHARD_INDEXES) return new Response('Not found', { status: 404 })
    return json(await shardStub(env, { region, index }).stats())
  }
  const vault = env.VAULT.getByName('dumps')
  if (path === '/admin/dumps') return json(await vault.list(100))
  const id = decodeURIComponent(path.slice('/admin/dumps/'.length))
  const bytes = /^[\w-]{1,80}$/.test(id) ? await vault.get(id) : null
  if (!bytes) return new Response('Not found', { status: 404 })
  return new Response(bytes, { headers: { 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="${id}.json.gz"` } })
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const origin = request.headers.get('Origin')
    // Browsers always say where the page came from; other clients (bots, tests) send no Origin.
    if (origin !== null && !allowedOrigin(env, origin)) return new Response('Forbidden', { status: 403 })
    const headers = cors(origin)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    // The Worker answering is the check: no Durable Object is touched, so a flood of these costs nothing past the edge.
    if (path === '/health' && request.method === 'GET') return json({ ok: true, protocol: PROTOCOL }, 200, headers)
    // Verify an admin browser session without exposing the secret to the frontend bundle.
    if (path === '/admin/verify' && request.method === 'POST') {
      if (!(await env.CONNECT_LIMIT.limit({ key: 'admin-verify:' + ipOf(request) })).success) return json({ admin: false }, 429, headers)
      const supplied = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
      const secret = env.GAME_ADMIN_TOKEN ?? ''
      const hash = async (v: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)))
      const authorized = Boolean(secret && supplied) && crypto.subtle.timingSafeEqual(await hash(secret), await hash(supplied))
      return json({ admin: authorized }, authorized ? 200 : 401, headers)
    }
    if (path === '/admin/spawn' && request.method === 'POST') {
      if (!(await env.CONNECT_LIMIT.limit({ key: 'admin-spawn:' + ipOf(request) })).success) return json({ ok: false }, 429, headers)
      const supplied = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
      const secret = env.GAME_ADMIN_TOKEN ?? ''
      const hash = async (v: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)))
      if (!secret || !supplied || !crypto.subtle.timingSafeEqual(await hash(secret), await hash(supplied))) return json({ ok: false }, 401, headers)
      const raw: unknown = await request.json().catch(() => null)
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return json({ ok: false }, 400, headers)
      const data = raw as Record<string, unknown>
      const code = parseRoomCode(data.room)
      const enemy = data.enemy
      const count = data.count
      const target = data.target
      if (!code || typeof enemy !== 'string' || !Object.hasOwn(ENEMIES, enemy) || !Number.isInteger(count) || (count as number) < 1 || (count as number) > 20) return json({ ok: false }, 400, headers)
      if (target !== undefined && (typeof target !== 'string' || target.length > 32 || target.length < 1)) return json({ ok: false }, 400, headers)
      const shard = shardOf(code)
      if (!shard) return json({ ok: false }, 404, headers)
      const ok = await shardStub(env, shard).spawnAdminEnemy(code, enemy, count as number, target as string | undefined)
      return json({ ok }, ok ? 200 : 409, headers)
    }
    if (path.startsWith('/trainers/') ) {
      if (!(await env.CONNECT_LIMIT.limit({ key: 'trainer:' + ipOf(request) })).success) return json({ error: 'rate' }, 429, headers)
      if ((path === '/trainers/login' || path === '/trainers/register') && !(await env.TRAINER_AUTH_LIMIT.limit({ key: 'trainer-login:' + ipOf(request) })).success) return json({ error: 'rate' }, 429, headers)
      const store = env.TRAINER_ACCOUNTS.getByName('global')
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? ''
      if (path === '/trainers/register' && request.method === 'POST') {
        const data = await request.json().catch(() => null) as { handle?: string; password?: string; name?: string } | null
        const result = await store.register(data?.handle, data?.password, data?.name)
        return json(result, 'error' in result ? 400 : 200, headers)
      }
      if (path === '/trainers/login' && request.method === 'POST') {
        const data = await request.json().catch(() => null) as { handle?: string; password?: string } | null
        const result = await store.login(data?.handle, data?.password)
        return json(result, 'error' in result ? 401 : 200, headers)
      }
      if (path === '/trainers/me' && request.method === 'GET') {
        const user = await store.identify(token)
        return json(user ? { profile: { id: user.id, handle: user.handle, name: user.name, created: user.created } } : { error: 'unauthorized' }, user ? 200 : 401, headers)
      }
      if (path === '/trainers/name' && request.method === 'POST') {
        const data = await request.json().catch(() => null) as { name?: string } | null
        const profile = await store.update(token, data?.name)
        return json(profile ? { profile } : { error: 'unauthorized' }, profile ? 200 : 401, headers)
      }
      if (path === '/trainers/logout' && request.method === 'POST') {
        await store.logout(token)
        return json({ ok: true }, 200, headers)
      }
      const found = /^\/trainers\/profile\/([a-z0-9_]{3,20})$/.exec(path)
      if (found && request.method === 'GET') {
        const profile = await store.profile(found[1])
        return json(profile ? { profile } : { error: 'missing' }, profile ? 200 : 404, headers)
      }
      return new Response('Not found', { status: 404, headers })
    }
    if (path === '/rooms' && request.method === 'POST') return createRoom(request, env, headers)
    const ws = path.match(/^\/rooms\/([^/]+)\/ws$/)
    if (ws && request.method === 'GET') {
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 })
      if (!(await env.CONNECT_LIMIT.limit({ key: ipOf(request) })).success) return new Response('Too many connections', { status: 429 })
      const code = parseRoomCode(ws[1])
      if (!code) return new Response('Bad room code', { status: 400 })
      // Where this socket meets Cloudflare, for the room's telemetry (set here, so a client can't say it).
      const headers = new Headers(request.headers)
      headers.set(EDGE_HEADER, JSON.stringify(edgeOf(request.cf)))
      const shard = shardOf(code)
      // A code naming no shard (a VPS relay's, or none of ours) has no room here.
      return shard ? shardStub(env, shard).fetch(new Request(request, { headers })) : noSuchRoom()
    }
    if (path === '/arena/queue' && request.method === 'GET') {
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 })
      if (!(await env.CONNECT_LIMIT.limit({ key: ipOf(request) })).success) return new Response('Too many connections', { status: 429 })
      const headers = new Headers(request.headers)
      headers.set(HINT_HEADER, hintFor(request.cf) ?? '')
      // One matchmaker for everyone in v1 (a small pool split by region would match nobody), on the US east coast like South America's rooms.
      return env.MATCHMAKER.getByName('arena', { locationHint: 'enam' }).fetch(new Request(request, { headers }))
    }
    if ((path.startsWith('/admin/dumps') || path.startsWith('/admin/shards/')) && request.method === 'GET') return admin(request, env, path)
    return new Response('Not found', { status: 404, headers })
  },
} satisfies ExportedHandler<Env>
