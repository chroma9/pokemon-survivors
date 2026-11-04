# Pokémon Survivors — Persistent Project Notes

Last reviewed: 2026-11-04
Purpose: Read this file at the start of every new ChatGPT development session. This document preserves decisions across chats. Update it when the owner changes a requirement or when an important migration milestone is completed.

## Non-negotiable project direction

- **Upstream source:** `pedrobarretto/pokemon-survivors:main`.
- **Our repository:** `chroma9/pokemon-survivors`.
- **The ONLY active development target:** `Updated-11-3-2026`. Always specify this branch explicitly for GitHub writes.
- **Do not work on old backup, experimental, rebuild, coop-mode, or production main branches.** Do not take an old branch as the source of truth for ongoing development.
- **Goal:** Start from the newer upstream Pokémon Survivors engine/game and restore/adapt our custom gameplay, profiles, multiplayer, relay, admin, Pokémon and UI features without regressing upstream improvements.
- The existing production `main` may be used **read-only as a reference** for pre-migration behavior/code when necessary; it is NOT our target branch. Prefer the migration inventory and current `Updated-11-3-2026` code.
- **Current owner instruction:** finish transferring/reconciling all features first; do not begin broad debugging or compilation-error triage mid-port, because unfinished ports may resolve apparent errors. After feature parity is reached, perform integrated build, tests and gameplay validation.
- **No production merge, deployment, destructive branch operation or rewrite without explicit owner approval.** Keep the working live site untouched during the port.
- Keep the upstream engine, biomes, RULES 44, Arena, Dojo, co-op architecture, Boutique and other new features. Adapt custom modules to upstream rather than replacing whole newer files with old copies.
- Secure admin permissions on the server/relay. Client usernames and localStorage are NOT trusted authorization.
- Preserve save data, Trainer Accounts, gift inventories and existing Durable Object data across deployments. Never commit secrets.
- Owner prefers direct practical progress and concise status reporting. Do not repeatedly ask to restate these decisions.

## Migration baseline and inventory

- The migration started from upstream commit `0079e657811ff8a0fa4ae9969135fbd4e0c28a4a`.
- Upstream `main` continues changing. Check it, but do not silently rebase or restart the nearly completed port every time a new upstream commit lands. Report meaningful upstream differences and plan an integration point.
- Detailed feature checklist / history: `docs/private-feature-port-2026-11-03.md`. Read that document as well. It is a historical checkpoint, so verify against current source before declaring a feature completed.
- Latest branch commit observed on 2026-11-04: `e7a1f42103b572412edefae6ad79e2965faccd55` (display private Trainer Account name in lobby Trainer chip).
- Source-level ports already committed to update branch include Trainer Accounts and cloud sync, protected admin commands, private relay/co-op authentication, gifts, referrals, lobby, Onix/Steelix, Meowth/Persian, shiny sprites, Spiritomb Strengthening, Shadow Ball/Dark Pulse, Palkia Rift/Spacial Rend, private Shadow Mewtwo/Clone appearance, and Dark Nova.
- **Committed does not mean tested or feature-complete.** Some integration, UI, presentation, progression, save and gift edge cases remain under review.
- Latest checked GitHub Actions on the migration head included a failed private-port check and an ongoing CI run; no verified passing integration/build result yet. Recheck after migration is completed.
- Palkia presentation, Rift audio/visuals, supporter and account UI, admin announcements, normal/shiny gift behavior, and private relay integrations warrant parity review.
- Current task is to finish feature-parity comparison and integrate missing pieces on `Updated-11-3-2026`, then run integrated validation. Do not claim full completion based solely on commit messages.

## Custom features to preserve

- Private Trainer Accounts: registration/login, logout, username/profile, cloud progress sync and saves, password reset, supporter tiers, companion selection and explicit **No companion** unequip semantics.
- Private Cloudflare Worker relay and co-op; authenticated host/admin tools; synchronized admin spawning; commands for money, unlock/revoke Pokémon families, unlock shiny, gifts, backup restore, read-only Observatory, and announcement popups.
- Referral sharing/invite UI, eligible solo and completed co-op run credit, community goals, and in-game social UI choices. Avoid awarding credit for unfinished co-op runs.
- Mystery Gifts for specified Pokémon including shiny/normal variants, legacy Legendary gifts, shiny tickets, and correct portraits.
- Playable Onix → Steelix (Rare egg), Meowth → Persian (Common egg), custom sprites including shiny Onix/Meowth.
- Spiritomb (Ultra Rare egg), one-stage Strengthening stat progression, Shadow Ball and Dark Pulse (including recipient distribution).
- Palkia as a legendary, Rift/Spear Pillar event and domain, Spacial Rend, assets/portraits, visuals and dialogue.
- Private Shadow Mewtwo and Mewtwo Clone forms; Shadow type, Dark Nova cinematic orb, hazard and associated effects. Do not rely on a client-side username as a security boundary.
- Preserve UI decisions: focused lobby rather than unnecessary promotional tiles, private trainer account in corner/trainer card, correct companion selection, and compatible new upstream interfaces.

## How to work in subsequent chats

1. Read this `NOTES.md` from `chroma9/pokemon-survivors` at ref `Updated-11-3-2026`.
2. Read `docs/private-feature-port-2026-11-03.md` and latest commits on that same branch.
3. Compare feature inventory against current files and upstream changes; distinguish **ported**, **needs integration**, **untested**, and **deliberately excluded**.
4. Make all ordinary development commits only to `Updated-11-3-2026` and report commit SHAs.
5. Keep this document current when the owner changes direction or a feature is finished; avoid speculative status claims.
6. When porting is done, run typechecks, CI, unit tests, multiplayer/gameplay smoke tests and deployment-readiness checks, without deploying until authorized.

## Session handoff

As of 2026-11-04, owner clarified: **Ignore all old branches for development. Use only `Updated-11-3-2026`.** Migration is still in progress, and broad debugging/testing is intentionally deferred until all features have been moved.

## Ongoing documentation policy — owner instruction, 2026-11-04

- Update this file **alongside every meaningful milestone**, not only at the end of a session: completed migration phases, important design/branch decisions, newly discovered blockers, verified test outcomes, changed deployment requirements, and major fixes. Include date, commit or other evidence, and the next action.
- Keep this file a concise, current handoff rather than dumping every trivial commit; put detailed implementation histories in `docs/private-feature-port-2026-11-03.md`.
- Clearly label **ported in code**, **verified**, **pending**, and **blocked**. Never interpret a commit title or passing compilation alone as a completed gameplay feature.
- At the beginning of each future session, read this file before making changes, and refresh its status after reaching a milestone.

### Progress review — 2026-11-04

- **Approximate migration status:** ~85% of intended custom feature transfer appears represented in source. This is a qualitative estimate, not a measured percentage or release-readiness figure.
- Recent commits restored lobby trainer identity, focused private lobby, admin announcement polling, private referral links, and eligible solo/completed co-op referral accounting.
- **Remaining transfer/reconciliation:** inspect custom game/relay/UI differences not yet matched, including Rift presentation and media, supporter and account interactions, saved progress and gift edge cases, progression correctness, and upstream compatibility. Track anything deliberately excluded.
- **Integration validation pending:** GitHub Actions private-port workflow is failing at the reviewed head `0f35e7207`; CI was in progress for that head at time of review. Earlier head `e7a1f4210` showed failures in both CI and private-port workflows. Causes have not been diagnosed, consistent with owner's migrate-first instruction.
- Do not confuse **migration completeness** with **release readiness**: no production deployment, no confirmed successful full build or end-to-end multiplayer/cloud-save test yet.
- **Next step:** complete feature parity review and missing port work on `Updated-11-3-2026`; then begin joint debugging, automated checks, smoke testing and Cloudflare deployment review before requesting owner approval.

### Feature-parity fix — custom playable lobby sprite forms (2026-11-04)

- **Ported in source, not yet runtime-verified.** In `src/ui/title.ts`, the updated lobby's partner stage loaded and displayed only the base dex sprite, ignoring `playableForm(save.partner)`. This could show regular Mewtwo in the lobby for the custom Shadow Mewtwo playable identity.
- Commit `cf7bd20ad7e489e59e170a4d541a3451be3b2b41` restores `playableForm` and `playableShiny` selection, loads the correct form sheet, and uses the current upstream form-aware `sprites()` render lookup only when a custom form exists; ordinary Pokémon keep the original loaded sprite path.
- Next verification after the full port: Shadow Mewtwo appears in custom form on the lobby stage, ordinary partners/shinies remain unchanged, and both form preloading and rendering work after reload.

### Feature-parity audit and integration fixes — 2026-11-04

**Completed in source (not yet built or run):**
- `44309880c506625b6c00c4960cc48dffc05844fd`: the partner-selection hero now retrieves custom playable-form sprites through the form-aware renderer, instead of passing an ignored third argument to `loadedSprites`. Egg teaser and shiny selection portraits also use `playablePortrait`, preserving custom forms.
- `bda96d59c3f9bccd6bd6fcf9879a2ffacf531f37`: private Trainer login and rename now dispatch the same `ps:trainer-changed` notification as registration and refresh.
- `4ee62076e15257ca1faee406ac12f13ca9e4a5a8`: the lobby Trainer chip listens for the private Trainer change event and unsubscribes when disposed.
- `170915ce836d255a77c1786897710e690e747bbc`: private Trainer login now binds local save ownership to the authenticated account, preserving a backup if switching accounts, clearing the previous owner's merge revision/baseline, and starting cloud save sync after login. This closes a data-isolation/synchronization gap compared to account registration.

**Source confirmed during audit:** the private companion picker saves an explicit null for "No companion" and calls its supplied private sync callback; private gift UI uses the adapted upstream gift screen and calls cloud save sync; solo referral reports only rankable runs and co-op referral reports completed games, excluding Arena/abandoned rooms. These are source observations, not end-to-end validation.

**Still to audit or validate:** save switching while a sync is already in flight; account recovery, Cloudflare Worker session revocation and profile continuity, supporter status across Clerk/private accounts, full Palkia/Spiritomb/Shadow Mewtwo content gameplay, save/gift edge cases, and multiplayer determinism. The private Mewtwo variant's client-side visibility check is not server authorization; do not portray it as secure.

**Next actions:** finish source parity reconciliation, then integrated TypeScript/build/test debugging and hands-on two-client/co-op/cloud profile tests in a non-production deployment. Do not deploy or merge to main without approval.

### Supporter identity and upstream delta audit — 2026-11-04

- **Ported in source, not runtime-verified:** commit `5f8330dd4d5058d314f6f22a9c8ad12c6c6f94a4` updates the Trainer Card/avatar to use the active private Trainer Account's supporter tier where one exists, rather than incorrectly relying on the original Clerk account's supporter status. This preserves private Diamond/Gold/Supporter badges and companion eligibility on that card.
- **Ported in source:** commit `7a906e82b6f3b6c9b4960298a672d6b3afadacd7` prevents an unrelated upstream/Clerk OG plate from appearing alongside a private Trainer identity.
- **Upstream delta:** at the time of review, `pedrobarretto/pokemon-survivors:main` was three commits ahead of the migration baseline `0079e6578`. The delta includes a substantial Boutique/emote asset set and cosmetic-store follow-ups. These commits are NOT automatically in the update branch. Integrate only after inspecting their interactions with our custom features, and record the exact upstream target SHA. Do not restart the migration branch or overwrite custom changes.
- **Source parity reviewed:** Onix public egg gate remains open; Palkia Rift domain contains dedicated three-phase Spacial Rend encounter patterns; Shadow Mewtwo custom identity and shadow sprite form exist. Note Shadow Mewtwo's actual playable type in both the original fork and the update branch remains `psychic`, despite the broader Shadow damage type being registered. Do not change its gameplay type without a specific owner decision.
- **Next:** finish avatar/form checks, audit the remaining private account/co-op and gift endpoints, then reconcile the upstream delta; keep full builds and end-to-end validation as a separate phase.

### Cloud-save account switching guard — 2026-11-04

- Commit `1034a3c3dac3c8e5f7040312bec2e73ef008ef1d` protects `syncTrainerSave` against an in-flight request finishing after private account login/logout/switch. It captures the session token and Trainer ID, checks that they still match after each awaited request and before updating local data, and uses the captured token for the save POST.
- **Why this matters:** old cloud data or revision metadata must not be written into a different signed-in Trainer's local storage. A stale response is ignored with `reason: 'accountChanged'`.
- **Source only; tests pending:** verify delayed network responses, switching between two accounts, sign-out while sync is busy, new-device login, cloud revisions, and the explicit "No companion" merge behavior during integrated validation. Do not claim these scenarios passed until tested.
