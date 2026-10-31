import { applyGift, type Gift } from './game/gifts'
import { loadSave, writeSave } from './ui/save'
import { parseSaveData } from './game/meta'
import { mergeSaves } from './game/sync'

export type TrainerProfile = { id: string; handle: string; name: string; created: number }
const REF = 'ps:trainerReferral'
const landed = new URLSearchParams(location.search).get('ref')
if (landed && /^[a-z0-9_]{3,20}$/i.test(landed) && !localStorage.getItem(REF)) localStorage.setItem(REF, landed.toLowerCase())
const KEY = 'ps:trainerSession'
const PROFILE = 'ps:trainerProfile'
const SAVE_OWNER = 'ps:trainerSaveOwner'
const SAVE_KEY = 'ps:save'
const bindLocalSaveTo = (id: string) => {
  const previous = localStorage.getItem(SAVE_OWNER)
  if (previous && previous !== id) {
    // Keep a recoverable copy. Never silently merge another trainer's local data.
    const current = localStorage.getItem(SAVE_KEY)
    if (current !== null) localStorage.setItem('ps:trainerSaveBackup:' + previous, current)
    localStorage.removeItem(SAVE_KEY)
  }
  localStorage.setItem(SAVE_OWNER, id)
}

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
  bindLocalSaveTo(result.profile.id)
  localStorage.setItem(KEY, result.token)
  localStorage.setItem(PROFILE, JSON.stringify(result.profile))
  window.dispatchEvent(new Event('ps:trainer-changed'))
  queueMicrotask(() => void syncTrainerSave(relay).catch(console.warn))
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
  window.dispatchEvent(new Event('ps:trainer-changed'))
  return profile
}
export const renameTrainer = async (relay: string, name: string) => {
  const profile = (await request(relay, 'name', 'POST', { name })).profile as TrainerProfile
  localStorage.setItem(PROFILE, JSON.stringify(profile))
  return profile
}
export const logoutTrainer = async (relay: string) => {
  // Do not discard pending debounced changes when a trainer signs out.
  if (syncTimer !== null) { clearTimeout(syncTimer); syncTimer = null }
  await syncTrainerSave(relay)
  try { await request(relay, 'logout', 'POST') } finally {
    localStorage.removeItem(KEY)
    localStorage.removeItem(PROFILE)
    window.dispatchEvent(new Event('ps:trainer-changed'))
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

const REV = 'ps:trainerSaveRevision'
const BASELINE = 'ps:trainerSaveBaseline'
let syncBusy = false
let syncPending = false

/** A remembered snapshot identifies which incubator changed since this browser last synchronized.
 * Eggs are consumables: merging two egg arrays by maximum count resurrects hatched eggs.
 */
const baselineSave = (): ReturnType<typeof loadSave> | null => {
  try {
    const raw = localStorage.getItem(BASELINE)
    return raw ? parseSaveData(JSON.parse(raw)) : null
  } catch { return null }
}
const sameEggs = (a: ReturnType<typeof loadSave>, b: ReturnType<typeof loadSave>) =>
  JSON.stringify(a.eggs) === JSON.stringify(b.eggs)

/** Choose the authoritative egg inventory while still merging permanent progress normally. */
const mergeTrainerSave = (cloud: ReturnType<typeof loadSave>, local: ReturnType<typeof loadSave>, revision: number) => {
  const combined = mergeSaves(cloud, local)
  const baseline = baselineSave()
  const seenRevision = Number(localStorage.getItem(REV))
  // A browser which just hatched or collected an egg must not receive the old egg back.
  // For a new browser, the cloud wins; for a browser with no local edits, cloud wins too.
  const localChanged = baseline ? !sameEggs(local, baseline) : revision > 0 && seenRevision === revision
  const cloudChanged = baseline ? !sameEggs(cloud, baseline) : false
  const eggs = localChanged && (!cloudChanged || seenRevision === revision) ? local.eggs : cloud.eggs
  return { ...combined, eggs }
}

/** Merge server and device progress, then CAS upload. A fresh local edit reruns syncing. */
export const syncTrainerSave = async (relay: string) => {
  if (!trainerToken()) return { synced: false, reason: 'signedOut' }
  if (syncBusy) { syncPending = true; return { synced: false, reason: 'busy' } }
  syncBusy = true
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
      const cloud = await request(relay, 'save') as { revision: number; data: unknown; updated: number }
      const local = loadSave()
      const merged = cloud.data === null ? local : mergeTrainerSave(parseSaveData(cloud.data), local, cloud.revision)
      const result = await fetch(relay + '/trainers/save', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + trainerToken() }, body: JSON.stringify({ revision: cloud.revision, data: merged }) })
      if (result.status === 409) continue
      const body = await result.json()
      if (!result.ok) throw Error(body.error ?? 'Cloud save failed')
      localStorage.setItem(REV, String(body.revision))
      // Keep changes made during the HTTP request and schedule another sync.
      const latest = loadSave()
      if (JSON.stringify(latest) !== JSON.stringify(local)) {
        writeSave(mergeTrainerSave(merged, latest, body.revision))
        syncPending = true
      } else writeSave(merged)
      localStorage.setItem(BASELINE, JSON.stringify(merged))
      return { synced: true, revision: body.revision }
    }
    throw Error('Save changed on another device; please retry synchronization')
  } finally {
    syncBusy = false
    if (syncPending) { syncPending = false; queueMicrotask(() => void syncTrainerSave(relay).catch(console.warn)) }
  }
}
let syncTimer: ReturnType<typeof setTimeout> | null = null
export const scheduleTrainerSave = (relay: string) => {
  if (!trainerToken()) return
  if (syncTimer !== null) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncTimer = null
    void syncTrainerSave(relay).catch((error) => console.warn('Trainer cloud sync failed', error))
  }, 3000)
}
