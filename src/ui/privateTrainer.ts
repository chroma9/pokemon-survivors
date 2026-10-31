import type { Input } from '../engine/input'
import type { Screen } from './screens'
import { h, later } from './dom'
import { backButton, shellBody, topBar } from './shell'
import { coopUrl } from '../coopShell'
import { currentTrainer, loginTrainer, logoutTrainer, refreshTrainer, registerTrainer, renameTrainer, trainerLookup, syncTrainerSave } from '../trainerAccounts'

/** Cloud account management, using the same card and button vocabulary as the game. */
export const openTrainerProfiles = (root: HTMLElement, input: Input, onClose: () => void): Screen => {
  const el = h('div', { class: 'screen shell dim settings-screen trainer-profile-screen' })
  const panel = h('section', { class: 'box trainer-account-panel' })
  Object.assign(panel.style, { width: 'min(100%, 480px)', margin: '18px auto', padding: 'clamp(16px, 4vw, 28px)', boxSizing: 'border-box' })
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
  const dispose = () => { if (disposed) return; disposed = true; offKeys(); el.remove() }
  let mode: 'signin' | 'register' = 'signin'
  let message = ''
  let busy = false
  const line = (tag: string, value: string, cls = '') => h(tag, { class: cls }, value)
  const append = (...nodes: Node[]) => panel.append(...nodes)
  const field = (label: string, placeholder: string, type = 'text', autocomplete = 'off') => {
    const wrapper = h('label', { class: 'trainer-account-field' })
    Object.assign(wrapper.style, { display: 'grid', gap: '6px', margin: '14px 0', textAlign: 'left' })
    const value = h('input', { class: 'box', placeholder, type, autocomplete }) as HTMLInputElement
    Object.assign(value.style, { width: '100%', padding: '10px', minHeight: '44px', boxSizing: 'border-box' })
    wrapper.append(line('span', label), value)
    append(wrapper)
    return value
  }
  const button = (label: string, handler: () => Promise<unknown>, rerender = true) => {
    const node = h('button', { class: 'btn', type: 'button' }, label) as HTMLButtonElement
    Object.assign(node.style, { width: '100%', display: 'block', margin: '10px 0', minHeight: '44px' })
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
    append(line('h2', user ? 'Your Trainer Card' : mode === 'signin' ? 'Welcome back, Trainer!' : 'Become a Trainer'))
    append(line('p', user ? 'Your progress follows you across devices.' : 'One account for your Pokémon and your cloud save.'))
    const status = line('p', message, 'trainer-account-status')
    status.setAttribute('role', 'status')
    Object.assign(status.style, { minHeight: '18px', overflowWrap: 'anywhere' })
    append(status)
    if (!relay) { status.textContent = 'The private relay is unavailable.'; return }
    if (user) {
      append(line('h3', user.name), line('p', '@' + user.handle))
      const id = line('small', 'Trainer ID: ' + user.id)
      Object.assign(id.style, { overflowWrap: 'anywhere', display: 'block', marginBottom: '16px' })
      append(id)
      button('Sync cloud save', async () => {
        const result = await syncTrainerSave(relay)
        message = result.synced ? 'Cloud save synchronized (revision ' + result.revision + ')' : 'A synchronization is already running.'
        status.textContent = message
      }, false)
      button('Refresh Trainer Card', async () => { await refreshTrainer(relay) })
      const name = field('Display name', 'New trainer name', 'text', 'nickname')
      button('Change display name', async () => { await renameTrainer(relay, name.value) })
      button('Sign out', async () => { await logoutTrainer(relay) })
    } else {
      const tabs = h('div', { class: 'trainer-account-tabs' })
      Object.assign(tabs.style, { display: 'flex', gap: '8px', margin: '16px 0' })
      for (const [value, caption] of [['signin', 'Sign in'], ['register', 'Create account']] as const) {
        const tab = h('button', { class: 'btn', type: 'button' }, caption) as HTMLButtonElement
        Object.assign(tab.style, { flex: '1', opacity: mode === value ? '1' : '.65' })
        tab.setAttribute('aria-pressed', String(mode === value))
        tab.onclick = () => { mode = value; message = ''; render() }
        tabs.append(tab)
      }
      append(tabs)
      const handle = field('Username', '3–20 letters, numbers, or _', 'text', 'username')
      const name = mode === 'register' ? field('Display name', 'What other trainers see', 'text', 'nickname') : null
      const password = field('Password', mode === 'signin' ? 'Your password' : 'At least 12 characters', 'password', mode === 'signin' ? 'current-password' : 'new-password')
      const toggle = h('label', {}, h('input', { type: 'checkbox' }), ' Show password')
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
    append(h('hr'), line('h3', 'Find a Trainer'))
    const lookup = field('Trainer username', 'Search by username')
    button('View Trainer Profile', async () => {
      const profile = await trainerLookup(relay, lookup.value)
      message = profile.name + ' (@' + profile.handle + ') — Trainer ID: ' + profile.id
      status.textContent = message
    }, false)
  }
  render()
  return { el, dispose }
}
