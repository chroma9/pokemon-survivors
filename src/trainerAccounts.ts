import { applyGift, type Gift } from './game/gifts'
import { loadSave, writeSave } from './ui/save'

export type TrainerProfile = { id: string; handle: string; name: string; created: number }
const REF = 'ps:trainerReferral'
const landed = new URLSearchParams(location.search).get('ref')
if (landed && /^[a-z0-9_]{3,20}$/i.test(landed) && !localStorage.getItem(REF)) localStorage.setItem(REF, landed.toLowerCase())
const KEY = 'ps:trainerSession'
const PROFILE = 'ps:trainerProfile'
export const trainerToken = () => localStorage.getItem(KEY)
export const currentTrainer = (): TrainerProfile | null => {
  try { return JSON.parse(localStorage.getItem(PROFILE) ?? 'null') as TrainerProfile | null } catch { return null }
}
const request = async (relay: string, path: string, method = 'GET', body?: unknown) => {
  const response = await fetch(relay + '/trainers/' + path, { method, headers: { 'Content-Type': 'application/json', ...(trainerToken() ? { Authorization: 'Bearer ' + trainerToken() } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  const result = await response.json()
  if (!response.ok) throw Error(result.error ?? 'Request failed')
  return result
}
export const registerTrainer = async (relay: string, handle: string, password: string, name: string) => {
  const result = await request(relay, 'register', 'POST', { handle, password, name, referrer: localStorage.getItem(REF) })
  localStorage.setItem(KEY, result.token)
  localStorage.setItem(PROFILE, JSON.stringify(result.profile))
  return result.profile as TrainerProfile
}
export const loginTrainer = async (relay: string, handle: string, password: string) => {
  const result = await request(relay, 'login', 'POST', { handle, password })
  localStorage.setItem(KEY, result.token)
  localStorage.setItem(PROFILE, JSON.stringify(result.profile))
  return result.profile as TrainerProfile
}
export const trainerLookup = async (relay: string, handle: string) => (await request(relay, 'profile/' + encodeURIComponent(handle.toLowerCase()))).profile as TrainerProfile
export const refreshTrainer = async (relay: string) => {
  const profile = (await request(relay, 'me')).profile as TrainerProfile
  localStorage.setItem(PROFILE, JSON.stringify(profile))
  return profile
}
export const renameTrainer = async (relay: string, name: string) => {
  const profile = (await request(relay, 'name', 'POST', { name })).profile as TrainerProfile
  localStorage.setItem(PROFILE, JSON.stringify(profile))
  return profile
}
export const logoutTrainer = async (relay: string) => {
  try { await request(relay, 'logout', 'POST') } finally {
    localStorage.removeItem(KEY)
    localStorage.removeItem(PROFILE)
  }
}

export type ReferralProgress = { handle: string; link: string; friends: { handle: string; name: string; runs: number; counted: boolean }[]; counted: number; milestones: { friends: number; reached: boolean }[] }
export const trainerReferrals = async (relay: string) => await request(relay, 'referrals') as ReferralProgress
export const submitTrainerReferralRun = async (relay: string, runId: string) => await request(relay, 'run', 'POST', { runId })
/** Gift IDs remain stable across devices; save.gifts makes applying an already claimed gift idempotent. */
export const collectTrainerGifts = async (relay: string) => {
  const result = await request(relay, 'gifts') as { gifts: Gift[] }
  const applied: string[] = []
  const blocked: string[] = []
  for (const gift of result.gifts) {
    const outcome = applyGift(loadSave(), gift)
    if (outcome.status === 'applied') {
      writeSave(outcome.save)
      applied.push(gift.id)
    } else if (outcome.status === 'wait') blocked.push(gift.id)
  }
  return { applied, blocked }
}
