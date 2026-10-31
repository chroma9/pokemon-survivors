import type { Input } from '../engine/input'
import type { Screen } from './screens'
import { h, later } from './dom'
import { backButton, shellBody, topBar } from './shell'
import { coopUrl } from '../coopShell'
import { collectTrainerGifts, currentTrainer, loginTrainer, logoutTrainer, refreshTrainer, registerTrainer, renameTrainer, trainerLookup, trainerReferrals, syncTrainerSave } from '../trainerAccounts'

/** Account management integrated into the game's Settings screen navigation. */
export const openTrainerProfiles = (root: HTMLElement, input: Input, onClose: () => void): Screen => {
  const el = h('div', { class: 'screen shell dim settings-screen trainer-profile-screen' })
  const panel = h('section', { class: 'box settings-rows' })
  const close = () => { dispose(); later(onClose) }
  el.append(topBar({ left: backButton(close), title: 'Trainer Profile' }), shellBody(h('div', { class: 'settings-panel' }, panel)))
  root.append(el)
  const offKeys = input.onKey((key) => {
    if (key === 'Escape' || key === 'Backspace') {
      if (document.activeElement instanceof HTMLInputElement) {
        if (key === 'Backspace') return
        document.activeElement.blur()
      }
      close()
    }
  })
  const dispose = () => { offKeys(); el.remove() }
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
  const action = (label: string, fn: () => Promise<unknown>, rerender = true) => {
    const node = elem('button', label) as HTMLButtonElement
    Object.assign(node.style, { margin: '4px', padding: '7px', cursor: 'pointer' })
    node.onclick = async () => {
      node.disabled = true
      try { await fn(); if (rerender) render(); else node.disabled = false } catch (e) { status.textContent = e instanceof Error ? e.message : String(e); node.disabled = false }
    }
  }
  let status: HTMLElement
  const render = () => {
    panel.replaceChildren()
    elem('h3', 'Trainer Profile')
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
      action('Sync cloud save now', async () => {
        const result = await syncTrainerSave(relay)
        status.textContent = result.synced ? 'Cloud save synchronized (revision ' + result.revision + ')' : 'Sync already in progress'
      }, false)
      elem('hr')
      elem('h3', 'Invite friends')
      elem('p', 'Friends qualify after 3 completed runs.')
      const referral = elem('p', 'Loading referrals…')
      void trainerReferrals(relay).then((result) => {
        if (!referral.isConnected) return
        referral.textContent = 'Your referrals: ' + result.counted + ' counted, ' + result.friends.length + ' joined'
        const link = new URL(location.origin + location.pathname)
        link.searchParams.set('ref', result.handle)
        const share = elem('button', 'Copy invite link') as HTMLButtonElement
        share.onclick = () => void navigator.clipboard.writeText(link.toString())
        for (const friend of result.friends) elem('p', friend.name + ' (@' + friend.handle + '): ' + friend.runs + '/3 runs' + (friend.counted ? ' — counted' : ''))
        for (const step of result.milestones) elem('p', step.friends + ' referrals: ' + (step.reached ? 'Unlocked' : 'Locked'))
      }).catch(() => { referral.textContent = 'Referral status unavailable' })
      action('Collect referral gifts', async () => {
        const outcome = await collectTrainerGifts(relay)
        status.textContent = outcome.applied.length + ' gifts collected, ' + outcome.blocked.length + ' waiting for egg slots.'
      }, false)
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
  }
  render()
  return { el, dispose }
}
