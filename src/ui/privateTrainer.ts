import type { Input } from '../engine/input'
import type { Screen } from './screens'
import { h, later } from './dom'
import { backButton, shellBody, topBar } from './shell'
import { coopUrl } from '../coopShell'
import { pokeballIcon } from '../render/art'
import { pendingPicks } from '../game/shinyPicks'
import { loadSave } from './save'
import { shinyPicker } from './supporters'
import { changeTrainerPassword, collectTrainerGifts, currentTrainer, loginTrainer, logoutTrainer, refreshTrainer, registerTrainer, renameTrainer, trainerLookup, syncTrainerSave } from '../trainerAccounts'

/** Cloud account management, using the same card and button vocabulary as the game. */
export const openTrainerProfiles = (root: HTMLElement, input: Input, onClose: () => void): Screen => {
  const el = h('div', { class: 'screen shell dim settings-screen trainer-profile-screen' })
  const panel = h('section', { class: 'box trainer-account-panel' })
  const close = () => { dispose(); later(onClose) }
  el.append(topBar({ left: backButton(close), title: 'Trainer Account' }), shellBody(h('div', { class: 'settings-panel' }, panel)))
  root.append(el)
  let disposed = false
  const offKeys = input.onKey((key) => {
    if (key !== 'Escape' && key !== 'Backspace') return
    if (document.activeElement instanceof HTMLInputElement) {
      if (key === 'Backspace') return
      document.activeElement.blur()
    }
    close()
  })
  const dispose = () => { if (disposed) return; disposed = true; shinyScreen?.dispose(); shinyScreen = null; offKeys(); el.remove() }
  let mode: 'signin' | 'register' = 'signin'
  let passwordPanel = false
  let shinyScreen: Screen | null = null
  let message = ''
  let busy = false
  const line = (tag: keyof HTMLElementTagNameMap, value: string, cls = '') => h(tag, { class: cls }, value)
  const append = (...nodes: Node[]) => panel.append(...nodes)
  const field = (label: string, placeholder: string, type = 'text', autocomplete = 'off') => {
    const wrapper = h('label', { class: 'trainer-account-field' })
      const value = h('input', { class: 'box', placeholder, type, autocomplete }) as HTMLInputElement
    wrapper.append(line('span', label), value)
    append(wrapper)
    return value
  }
  const button = (label: string, handler: () => Promise<unknown>, rerender = true) => {
    const node = h('button', { class: 'btn', type: 'button' }, label) as HTMLButtonElement
    node.onclick = async () => {
      if (busy) return
      busy = true
      node.disabled = true
      node.textContent = 'Working…'
      try {
        await handler()
        if (disposed) return
        if (rerender) { message = ''; render() } else { node.disabled = false; node.textContent = label }
      } catch (error) {
        if (!disposed) { message = error instanceof Error ? error.message : String(error); render() }
      } finally { busy = false }
    }
    append(node)
    return node
  }
  const render = () => {
    panel.replaceChildren()
    const relay = coopUrl()
    const user = currentTrainer()
    append(h('div', { class: 'trainer-account-hero' },
      h('span', { class: 'trainer-account-emblem' }, h('img', { src: pokeballIcon(), alt: '' })),
      h('div', {}, line('small', 'POKÉMON SURVIVORS • TRAINER NETWORK'), line('h2', user ? 'Your Trainer Card' : mode === 'signin' ? 'Welcome back!' : 'New Trainer'),
        line('p', user ? 'Your journey, saved across devices.' : 'Your Pokémon journey follows you anywhere.'))))
    const status = line('p', message, 'trainer-account-status')
    status.setAttribute('role', 'status')
    append(status)
    if (!relay) { status.textContent = 'The private relay is unavailable.'; return }
    if (user && (passwordPanel || user.mustChangePassword)) {
      append(line('h3', user.mustChangePassword ? 'Set your new password' : 'Change password'))
      append(line('p', user.mustChangePassword ? 'Your temporary password must be replaced before using your Trainer Account.' : 'Enter your current password and choose a new one.'))
      const oldPassword = field('Current or temporary password', 'Current password', 'password', 'current-password')
      const nextPassword = field('New password', 'At least 12 characters', 'password', 'new-password')
      const confirm = field('Confirm new password', 'Repeat new password', 'password', 'new-password')
      button('Save new password', async () => {
        if (nextPassword.value.length < 12 || nextPassword.value.length > 128) throw Error('New password must be 12–128 characters.')
        if (nextPassword.value !== confirm.value) throw Error('New passwords do not match.')
        if (oldPassword.value === nextPassword.value) throw Error('Choose a different password.')
        await changeTrainerPassword(relay, oldPassword.value, nextPassword.value)
        passwordPanel = false
      })
      if (!user.mustChangePassword) button('Cancel', async () => { passwordPanel = false })
      append(line('small', 'Changing your password signs out all other devices.'))
    } else if (user) {
      append(h('div', { class: 'trainer-account-identity' }, line('h3', user.name), line('p', '@' + user.handle), line('p', 'Supporter: ' + (user.supporterTier ?? 'None'))))
      const id = line('small', 'Trainer ID: ' + user.id)
      append(id)
      button('Sync cloud save', async () => {
        const result = await syncTrainerSave(relay)
        message = result.synced ? 'Cloud save synchronized (revision ' + result.revision + ')' : 'A synchronization is already running.'
        status.textContent = message
      }, false)
      button('Refresh Trainer Card', async () => { await refreshTrainer(relay) })
      button('Collect supporter rewards', async () => {
        const outcome = await collectTrainerGifts(relay)
        message = outcome.applied.length + ' rewards collected' + (outcome.blocked.length ? '; ' + outcome.blocked.length + ' waiting for incubator space' : '')
        status.textContent = message
        await syncTrainerSave(relay)
      }, false)
      const tickets = pendingPicks(loadSave()).length
      if (tickets) button('Choose shiny Pokémon (' + tickets + ' ticket' + (tickets === 1 ? '' : 's') + ')', async () => {
        el.classList.add('hidden')
        shinyScreen = shinyPicker(root, input, { play: () => { shinyScreen?.dispose(); shinyScreen = null; el.classList.remove('hidden'); render() } }, () => { shinyScreen = null; el.classList.remove('hidden'); render() }, () => syncTrainerSave(relay))
      }, false)
      const name = field('Display name', 'New trainer name', 'text', 'nickname')
      button('Change display name', async () => { await renameTrainer(relay, name.value) })
      button('Change password', async () => { passwordPanel = true })
      button('Sign out', async () => { await logoutTrainer(relay) })
    } else {
      const tabs = h('div', { class: 'trainer-account-tabs' })
      for (const [value, caption] of [['signin', 'Sign in'], ['register', 'Create account']] as const) {
        const tab = h('button', { class: 'btn', type: 'button' }, caption) as HTMLButtonElement
        tab.classList.toggle('active', mode === value)
        tab.setAttribute('aria-pressed', String(mode === value))
        tab.onclick = () => { mode = value; message = ''; render() }
        tabs.append(tab)
      }
      append(tabs)
      const handle = field('Username', '3–20 letters, numbers, or _', 'text', 'username')
      const name = mode === 'register' ? field('Display name', 'What other trainers see', 'text', 'nickname') : null
      const password = field('Password', mode === 'signin' ? 'Your password' : 'At least 12 characters', 'password', mode === 'signin' ? 'current-password' : 'new-password')
      const toggle = h('label', { class: 'trainer-account-password-toggle' }, h('input', { type: 'checkbox' }), ' Show password')
      const check = toggle.querySelector('input') as HTMLInputElement
      check.onchange = () => { password.type = check.checked ? 'text' : 'password' }
      append(toggle)
      button(mode === 'signin' ? 'Sign in' : 'Create trainer account', async () => {
        if (!handle.value.trim() || !password.value) throw Error('Enter your username and password.')
        if (mode === 'register') {
          if (password.value.length < 12) throw Error('Password must contain at least 12 characters.')
          if (!name?.value.trim()) throw Error('Enter your display name.')
          await registerTrainer(relay, handle.value, password.value, name.value)
        } else await loginTrainer(relay, handle.value, password.value)
      })
    }
    append(h('hr', { class: 'trainer-account-divider' }), line('h3', 'Find a Trainer'))
    const lookup = field('Trainer username', 'Search by username')
    button('View Trainer Profile', async () => {
      const profile = await trainerLookup(relay, lookup.value)
      message = profile.name + ' (@' + profile.handle + ') — Trainer ID: ' + profile.id
      status.textContent = message
    }, false)
  }
  render()
  return { el, tick: (time) => shinyScreen?.tick?.(time), dispose }
}
