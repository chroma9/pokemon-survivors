import { accountHandle, accountState, onAccountChange } from './account'

/** Private cosmetic option. Username gating is a UI convenience, not security. */
export type MewtwoAppearance = 'normal' | 'clone'
const ALLOWED_HANDLE = 'chroma9'
let selected: MewtwoAppearance = 'normal'
const listeners = new Set<() => void>()
const notify = () => { for (const fn of listeners) fn() }

export const canUseMewtwoClone = () =>
  accountState().kind === 'signedIn' && accountHandle()?.toLowerCase() === ALLOWED_HANDLE
export const mewtwoAppearance = (): MewtwoAppearance =>
  canUseMewtwoClone() ? selected : 'normal'
export const onMewtwoAppearanceChange = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
export const setMewtwoAppearance = (form: MewtwoAppearance) => {
  if (form === 'clone' && !canUseMewtwoClone()) return
  selected = form
  notify()
}

// Switch back to Normal on account transitions to prevent stale selections.
onAccountChange(() => {
  selected = 'normal'
  notify()
})
