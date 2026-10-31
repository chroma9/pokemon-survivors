import { API_URL, accountState, onAccountChange, sessionToken } from './account'
import { timeoutSignal } from './net/timeout'

/** Client-side presentation only; the server checks Clerk's verified admin allowlist. */
export type MewtwoAppearance = 'normal' | 'clone'
let permitted = false
let selected: MewtwoAppearance = 'normal'
const listeners = new Set<() => void>()
const notify = () => { for (const fn of listeners) fn() }

export const mewtwoAppearance = (): MewtwoAppearance =>
  permitted && accountState().kind === 'signedIn' ? selected : 'normal'
export const canUseMewtwoClone = () => permitted && accountState().kind === 'signedIn'
export const onMewtwoAppearanceChange = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
export const setMewtwoAppearance = (form: MewtwoAppearance) => {
  if (form === 'clone' && !canUseMewtwoClone()) return
  selected = form
  notify()
}
/** Defaults to Normal whenever authentication, entitlement, or connectivity fails. */
export const refreshMewtwoAppearancePermission = async () => {
  permitted = false
  selected = 'normal'
  notify()
  if (!API_URL || accountState().kind !== 'signedIn') return
  const token = await sessionToken()
  if (!token || accountState().kind !== 'signedIn') return
  try {
    const res = await fetch(`${API_URL}/me/private-forms`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: timeoutSignal(5000),
    })
    if (!res.ok) return
    const body: unknown = await res.json()
    if (accountState().kind !== 'signedIn') return
    permitted = typeof body === 'object' && body !== null && 'mewtwoClone' in body && body.mewtwoClone === true
    notify()
  } catch {
    // No permission while offline; Normal remains playable.
  }
}

// Re-evaluate on sign-in and sign-out; never retain an entitlement across accounts.
onAccountChange(() => { void refreshMewtwoAppearancePermission() })
void refreshMewtwoAppearancePermission()
