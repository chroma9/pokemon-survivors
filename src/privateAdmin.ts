const TOKEN_KEY = 'ps:adminToken'

export const verifyPrivateAdmin = async (relay: string | null, value = localStorage.getItem(TOKEN_KEY) ?? ''): Promise<boolean> => {
  if (!relay || !value || value.length > 4096) return false
  try {
    const response = await fetch(`${relay}/admin/verify`, { method: 'POST', headers: { Authorization: `Bearer ${value}` } })
    return response.ok && (await response.json() as { admin: boolean }).admin === true
  } catch {
    return false
  }
}

export const privateAdminConsole = (relay: () => string | null, room: () => string | null = () => null) => ({
  password: async (token: string) => {
    if (!await verifyPrivateAdmin(relay(), token)) return 'ps: invalid token'
    localStorage.setItem(TOKEN_KEY, token)
    return 'ps: administrator authorized'
  },
  admin: async () => ({ authorized: await verifyPrivateAdmin(relay()), stored: Boolean(localStorage.getItem(TOKEN_KEY)) }),
  logout: () => { localStorage.removeItem(TOKEN_KEY); return 'ps: session cleared' },
  resetPassword: async (handle: string) => {
    if (!await verifyPrivateAdmin(relay())) return 'ps: unauthorized'
    if (!/^[a-z0-9_]{3,20}$/i.test(handle)) return 'ps.resetPassword: invalid handle'
    const password = window.prompt('Enter a new temporary password for @' + handle + ' (minimum 12 characters)')
    if (password === null) return 'ps.resetPassword: canceled'
    if (password.length < 12 || password.length > 128) return 'ps.resetPassword: password must be 12-128 characters'
    const endpoint = relay()
    if (!endpoint) return 'ps.resetPassword: relay unavailable'
    const response = await fetch(endpoint + '/admin/reset-password', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem(TOKEN_KEY), 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, password }),
    }).catch(() => null)
    return response?.ok ? 'ps: password reset; old sessions invalidated' : 'ps.resetPassword: failed (HTTP ' + (response?.status ?? 'offline') + ')'
  },
  givePokemon: async (handle: string, family: string, shiny = false) => {
    if (!await verifyPrivateAdmin(relay())) return 'ps: unauthorized'
    if (!/^[a-z0-9_]{3,20}$/i.test(handle) || !/^[a-z0-9_]{2,40}$/i.test(family) || typeof shiny !== 'boolean') return 'ps.givePokemon: invalid username, Pokémon or shiny flag'
    const url = relay()
    if (!url) return 'ps.givePokemon: relay unavailable'
    const res = await fetch(url + '/admin/give-pokemon', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem(TOKEN_KEY), 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, family: family.toLowerCase(), shiny }),
    }).catch(() => null)
    if (!res) return 'ps.givePokemon: relay unreachable'
    const result = await res.json().catch(() => null) as { error?: string } | null
    return res.ok ? 'ps: sent ' + (shiny ? 'shiny ' : '') + family + ' Mystery Gift to @' + handle : 'ps.givePokemon: ' + (result?.error ?? 'failed') + ' (HTTP ' + res.status + ')'
  },
  shinyTickets: async (handle: string, count = 1) => {
    if (!await verifyPrivateAdmin(relay())) return 'ps: unauthorized'
    if (!/^[a-z0-9_]{3,20}$/i.test(handle) || !Number.isInteger(count) || count < 1 || count > 10) return 'ps.shinyTickets: use a valid username and 1-10 tickets'
    const url = relay()
    if (!url) return 'ps.shinyTickets: relay unavailable'
    const res = await fetch(url + '/admin/shiny-tickets', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem(TOKEN_KEY), 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, count }),
    }).catch(() => null)
    return res?.ok ? 'ps: granted ' + count + ' shiny-choice ticket(s) to @' + handle : 'ps.shinyTickets: failed (HTTP ' + (res?.status ?? 'offline') + ')'
  },
  supporter: async (handle: string, tier: 'supporter' | 'gold' | 'diamond' | null) => {
    if (!await verifyPrivateAdmin(relay())) return 'ps: unauthorized'
    if (!/^[a-z0-9_]{3,20}$/i.test(handle) || (tier !== null && !['supporter', 'gold', 'diamond'].includes(tier))) return 'ps.supporter: invalid trainer or tier'
    const url = relay()
    if (!url) return 'ps.supporter: relay unavailable'
    const res = await fetch(url + '/admin/supporter', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem(TOKEN_KEY), 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle, tier }),
    }).catch(() => null)
    if (!res) return 'ps.supporter: relay unreachable'
    const body = await res.json().catch(() => null) as { error?: string; gifts?: number } | null
    return res.ok ? `ps: @${handle} assigned ${tier ?? 'no tier'}; ${body?.gifts ?? 0} rewards available` : `ps.supporter: ${body?.error ?? 'request failed'} (HTTP ${res.status})`
  },
  spawn: async (enemy: string, count = 1, target?: string) => {
    if (!await verifyPrivateAdmin(relay())) return 'ps: unauthorized'
    const code = room()
    if (!code) return 'ps.spawn: start a co-op run first'
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(enemy) || !Number.isInteger(count) || count < 1 || count > 20) return 'ps.spawn: invalid enemy/count'
    const url = relay()
    if (!url) return 'ps.spawn: relay unavailable'
    const response = await fetch(url + '/admin/spawn', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem(TOKEN_KEY), 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: code, enemy, count, target }),
    }).catch(() => null)
    return response?.ok ? 'ps: spawn queued for all players' : response ? `ps.spawn: relay rejected the command (HTTP ${response.status}${response.status === 409 ? '; room is not playing or target name is not in the active run' : response.status === 400 ? '; invalid room/enemy/count/target' : response.status === 401 ? '; admin token rejected' : response.status === 429 ? '; rate limited' : ''})` : 'ps.spawn: relay unreachable'
  },
})
