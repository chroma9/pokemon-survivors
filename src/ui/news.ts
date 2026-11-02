import { playSfx } from '../engine/audio'
import type { Input } from '../engine/input'
import { formatDay, locale, t } from '../i18n'
import type { ChangelogUpdate } from '../site/changelog'
import { localized } from '../site/localized'
import { ROUTES } from '../site/routes'
import { h, later } from './dom'
import { hint, menu, type Screen } from './screens'

/** The date of the newest update the player opened in Novidades, on this device. */
const SEEN = 'ps:newsSeen'

let newest: Promise<ChangelogUpdate> | null = null

/** The newest update. The changelog is its own chunk, loaded on the first ask: the game's bundle doesn't carry it. A failed load is asked again next time. */
export const latestUpdate = () =>
  (newest ??= import('../site/changelog').then(
    (m) => m.CHANGELOG[0]!,
    (err: unknown) => {
      newest = null
      throw err
    },
  ))

/** Whether `update` came out after the last one opened here (always, the first time). */
export const isUnread = (update: ChangelogUpdate) => {
  try {
    return localStorage.getItem(SEEN) !== update.date
  } catch {
    return false
  }
}

const markRead = (update: ChangelogUpdate) => {
  try {
    localStorage.setItem(SEEN, update.date)
  } catch {
    // Private modes may refuse: the dot just shows again next time.
  }
}

/**
 * Novidades, over the lobby: the newest update's title, date and highlights,
 * then "Ver tudo" (the changelog page, on that update, in a new tab) and
 * Fechar. Opening it marks the update read. Esc or Backspace close it.
 */
export const newsScreen = (root: HTMLElement, input: Input, onClose: () => void): Screen => {
  const m = t().news
  const el = h('div', { class: 'screen dim news-screen' })
  let nav: ReturnType<typeof menu> | null = null
  let closed = false

  const render = (update: ChangelogUpdate) => {
    markRead(update)
    const lang = locale()
    const url = `${ROUTES.changelog[lang]}#${update.date}`
    const buttons = [h('button', { class: 'btn confirm' }, m.seeAll), h('button', { class: 'btn' }, m.close)]
    const actions = [() => window.open(url, '_blank', 'noopener'), close]
    nav = menu(input, buttons, (i) => (playSfx('select'), later(actions[i]!)), { horizontal: true, initial: 0 })
    el.replaceChildren(
      h(
        'div',
        { class: 'dialog box pop news' },
        h('div', { class: 'dialog-title' }, m.title),
        h('p', { class: 'news-head' }, h('small', {}, m.update(formatDay(update.date))), h('b', {}, localized(update.title, lang))),
        h('ul', { class: 'news-list' }, ...update.highlights.map((line) => h('li', {}, localized(line, lang)))),
        h('div', { class: 'buttons' }, ...buttons),
        hint(m.hintKeys, m.hintTouch),
      ),
    )
  }

  const offKeys = input.onKey((key) => (key === 'Escape' || key === 'Backspace') && close())

  const dispose = () => {
    closed = true
    nav?.off()
    offKeys()
    el.remove()
  }

  function close() {
    if (closed) return
    playSfx('select')
    dispose()
    later(onClose)
  }

  void latestUpdate().then(
    (update) => !closed && render(update),
    () => {},
  )
  root.append(el)
  return { el, dispose, dim: 0.5 }
}


/** Announcements are published by an authorized administrator, never by a deployment. */
export type Announcement = { id: string; message: string }
const SEEN_ANNOUNCEMENT = 'ps:announcementSeen'
export const announcementPending = (announcement: Announcement) => {
  try { return localStorage.getItem(SEEN_ANNOUNCEMENT) !== announcement.id }
  catch { return false }
}

export const fetchAnnouncement = async (relay: string | null): Promise<Announcement | null> => {
  if (!relay) return null
  const res = await fetch(relay + '/announcement', { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json() as { announcement?: unknown }
  const a = data.announcement
  if (!a || typeof a !== 'object') return null
  const v = a as Partial<Announcement>
  return typeof v.id === 'string' && typeof v.message === 'string' && v.message.length <= 240 ? { id: v.id, message: v.message } : null
}

/** Dismissible update broadcast, acknowledged separately for each broadcast ID. */
export const announcementScreen = (root: HTMLElement, input: Input, announcement: Announcement, onClose: () => void): Screen => {
  const m = t().news
  const el = h('div', { class: 'screen dim news-screen' })
  let closed = false
  const buttons = [h('button', { class: 'btn confirm' }, m.close)]
  const nav = menu(input, buttons, () => close(), { horizontal: true, initial: 0 })
  const offKeys = input.onKey((key) => (key === 'Escape' || key === 'Backspace') && close())
  function dispose() {
    if (closed) return
    closed = true
    try { localStorage.setItem(SEEN_ANNOUNCEMENT, announcement.id) } catch { /* Storage unavailable. */ }
    nav.off()
    offKeys()
    el.remove()
  }
  function close() {
    if (closed) return
    playSfx('select')
    dispose()
    later(onClose)
  }
  el.append(h('div', { class: 'dialog box pop news' },
    h('div', { class: 'dialog-title' }, m.title),
    h('p', { class: 'news-head' }, announcement.message),
    h('div', { class: 'buttons' }, ...buttons),
    hint(m.hintKeys, m.hintTouch),
  ))
  root.append(el)
  return { el, dispose, dim: 0.5 }
}
