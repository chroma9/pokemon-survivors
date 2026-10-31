import { currentTrainer } from './trainerAccounts'

/** A private, cosmetic-only Mewtwo form. This client-side handle check is not an access-control boundary. */
export type MewtwoAppearance = 'normal' | 'clone'
const ALLOWED_HANDLE = 'chroma9'
let selected: MewtwoAppearance = 'normal'

export const canUseMewtwoClone = () => currentTrainer()?.handle?.toLowerCase() === ALLOWED_HANDLE
export const mewtwoAppearance = (): MewtwoAppearance =>
  canUseMewtwoClone() ? selected : 'normal'
export const setMewtwoAppearance = (form: MewtwoAppearance) => {
  selected = form === 'clone' && !canUseMewtwoClone() ? 'normal' : form
}

// Trainer Accounts dispatch this whenever authentication changes.
if (typeof window !== 'undefined') window.addEventListener('ps:trainer-changed', () => { selected = 'normal' })
