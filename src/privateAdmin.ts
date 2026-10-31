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

export const privateAdminConsole = (relay: () => string | null, room: () => string | null) => ({
  password: async (token: string) => {
    if (!await verifyPrivateAdmin(relay(), token)) return 'ps: invalid token'
    localStorage.setItem(TOKEN_KEY, token)
    return 'ps: administrator authorized'
  },
  admin: async () => ({ authorized: await verifyPrivateAdmin(relay()), stored: Boolean(localStorage.getItem(TOKEN_KEY)) }),
  logout: () => { localStorage.removeItem(TOKEN_KEY); return 'ps: session cleared' },
})
