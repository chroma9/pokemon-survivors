import { coopUrl } from '../coopShell'
import { currentTrainer, loginTrainer, logoutTrainer, refreshTrainer, registerTrainer, renameTrainer, trainerLookup } from '../trainerAccounts'

/** Minimal private-fork account screen; does not depend on the official Clerk server. */
export const mountTrainerProfiles = () => {
  if (document.getElementById('private-trainer-profile')) return
  const button = document.createElement('button')
  button.id = 'private-trainer-profile'
  button.textContent = 'Trainer Profile'
  Object.assign(button.style, { position: 'fixed', right: '12px', top: '12px', zIndex: '10000', padding: '9px 12px', color: '#fff', background: '#283f54', border: '2px solid #fff', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace' })
  document.body.append(button)
  const panel = document.createElement('section')
  Object.assign(panel.style, { display: 'none', position: 'fixed', right: '12px', top: '55px', width: 'min(92vw, 340px)', maxHeight: '75vh', overflowY: 'auto', zIndex: '10001', background: '#192b39', color: '#fff', border: '2px solid #eee', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', boxShadow: '0 6px 24px #0009' })
  document.body.append(panel)
  button.onclick = () => { panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; if (panel.style.display === 'block') render() }
  const elem = (tag: string, value?: string) => {
    const node = document.createElement(tag)
    if (value) node.textContent = value
    panel.append(node)
    return node
  }
  const field = (placeholder: string, type = 'text') => {
    const node = elem('input') as HTMLInputElement
    node.placeholder = placeholder
    node.type = type
    node.autocomplete = type === 'password' ? 'current-password' : 'off'
    Object.assign(node.style, { display: 'block', width: '95%', padding: '8px', margin: '8px 0', boxSizing: 'border-box' })
    return node
  }
  const action = (label: string, fn: () => Promise<unknown>) => {
    const node = elem('button', label) as HTMLButtonElement
    Object.assign(node.style, { margin: '4px', padding: '7px', cursor: 'pointer' })
    node.onclick = async () => {
      node.disabled = true
      try { await fn(); render() } catch (e) { status.textContent = e instanceof Error ? e.message : String(e); node.disabled = false }
    }
  }
  let status: HTMLElement
  const render = () => {
    panel.replaceChildren()
    elem('h3', 'Trainer Profiles')
    status = elem('p', '')
    const relay = coopUrl()
    if (!relay) { status.textContent = 'Co-op relay unavailable'; return }
    const user = currentTrainer()
    if (user) {
      elem('strong', user.name + ' (@' + user.handle + ')')
      elem('p', 'Trainer ID: ' + user.id)
      const name = field('New display name')
      action('Update name', async () => { await renameTrainer(relay, name.value) })
      action('Refresh profile', async () => { await refreshTrainer(relay) })
      action('Sign out', async () => { await logoutTrainer(relay) })
    } else {
      elem('p', 'Sign in to sync your trainer identity across browsers.')
      const handle = field('Username (3–20 letters/numbers/_)')
      const password = field('Password (12+ characters)', 'password')
      const name = field('Display name')
      action('Sign in', async () => { await loginTrainer(relay, handle.value, password.value) })
      action('Create account', async () => { await registerTrainer(relay, handle.value, password.value, name.value) })
    }
    elem('hr')
    elem('p', 'Look up a trainer')
    const lookup = field('Username')
    action('View profile', async () => {
      const profile = await trainerLookup(relay, lookup.value)
      status.textContent = profile.name + ' (@' + profile.handle + ') — Trainer ID: ' + profile.id
    })
    elem('small', 'Trainer accounts and administrator permissions are separate. Rejoin a co-op room after signing in or out.')
  }
}
