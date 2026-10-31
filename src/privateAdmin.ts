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
