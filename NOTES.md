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

### Additional private-profile safeguards and visual parity — 2026-11-04

- `3dd9b870da2e138fbf98d074127edbebd95e83b1`: Trainer Card and lobby avatar now use the Shadow Mewtwo form portrait when Shadow Mewtwo is the active companion/partner, preserving standard companion and other Pokémon portraits.
- `7dfd7310b04a4c59a907c0234abb625a21e3dfb9`: private Trainer sign-out now requires the final cloud-save synchronization to complete. If a sync is already busy or cannot finish, sign-out reports a retryable error rather than silently revoking the session while changes remain unsaved.
- **Still unverified:** build, UI and cloud-save regression tests. The account-switch guard and sign-out change require manual two-account and delayed-network scenarios during validation.
- **No action required from owner now.** Work remains isolated to `Updated-11-3-2026`; production main and Cloudflare deployments remain untouched.

### Community-goal / referral cross-check — 2026-11-04

- Private referrals are wired in both `src/game/referral.ts` and `relay/src/trainerAccounts.ts`: a referred player counts after three recorded runs; the 1/3/5/10 friend milestone reward schedules match at source level. Solo and completed co-op report calls were inspected in `src/main.ts`. No runtime confirmation yet.
- The upstream Halloween community candy goal is a **distinct system**, configured at `15_000_000` candies with a per-account cap of `20_000` in `src/data/halloween.ts`. Its client in `src/candyGoal.ts` reads the upstream `API_URL`, while the private relay contains a separate `/candy-goal` endpoint. Do **not** conflate this with older requests for a 15,000 community target or silently alter upstream game balance.
- **Open review item:** determine which community progress bar was intended to count private multiplayer runs and verify its associated server ledger/endpoint before making balance or reward changes. The 15-million Halloween total is not evidence that the private referral objective is correct or incorrect.

### Critical parity fix: local save changes now queue private cloud sync — 2026-11-04

- **Source fix committed:** `496801046b29ca01729d1b668ed40fc98f97dbca` restores the `ps:save-written` event in `src/ui/save.ts`, matching the existing private account listener in `src/main.ts` (which debounces `scheduleTrainerSave`).
- This event existed in the older fork's save writer but was missing from the new-upstream port. Without it, ordinary game progress changes may persist only on-device until an explicit sync, sign-out or reload.
- The writer compares serialized data and dispatches only if it actually changed, limiting redundant sync scheduling.
- **Verification still needed:** confirm gameplay earns/cloud persistence across browser refresh and devices; ensure writes originating from server sync do not cause uncontrolled repeat requests. The latter should settle because identical saved data produces no event, but this has not been runtime-tested.
- **Source review status:** confirmed `src/main.ts` subscribes to `ps:save-written`, `src/trainerAccounts.ts` debounces saves, and the updated writer emits that exact event.

### Private Trainer cloud progress refresh — 2026-11-04

- **Ported in source:** `0c044b50187b46bb87b65cffbb2522a11a0e3422` dispatches `ps:trainer-save-synced` only after a successful private Trainer save synchronization has updated local progress.
- **Ported in source:** `628e3dd1ec964e52ab6c98c01fc2204f054faf3f` subscribes the current lobby to that event, rebuilding it using the existing upstream refresh routine. The event listener is removed when the title screen is disposed.
- This restores the private cloud-sync UI refresh pathway without changing Clerk/upstream account listeners. Verify with two devices, a newly unlocked Pokémon and a save that changes companion/egg counts.
- Together with `4968010`, local gameplay save changes now schedule private cloud sync, and a completed sync refreshes the lobby.
- **Still not tested at runtime:** the changes are source-level only; integrated build and account/gameplay tests remain release gates.

### Private co-op Legendary roster restored through the loadout pipeline — 2026-11-04

**Material missing feature found:** The upstream co-op selector hid the Legendary tab, the co-op partner helper replaced legends with a regular starter, the wire parser rejected legends, and the co-op game loadout type excluded them. This silently lost a key private-fork feature.

**Ported in source (not yet runtime-tested):**
- `0f880987cbc3e0369b21e7fa8203f03c11745461` — allows Legendary tab and roster in the partner selector when the private co-op option is explicitly enabled; normal upstream co-op remains restricted by default.
- `18429b26437c92cf09a3ff2a569d8996520edf14` — `coopStarter(partner, true)` preserves legendary picks for private co-op.
- `928679ca421b4fa3e8ebc4dadad0fc210fa1e3ef` — co-op wire/loadout parser recognizes known `LEGEND_IDS` and widens `CoopPick` to `PlayableId`.
- `0a8e4291e6768d71130c05e22c8d0c70dce574ca`, `af2a018e6eeaa5f13d523e6e67b0c635fa98b41d` — the co-op game loadout accepts playable legends and removes its obsolete roster type import.
- `a0d9a58a54355b5c91cb435b4b6822994cbbd224` — private room loadout creation and partner selection preserve legends; Arena still uses its dedicated character roster.
- `d7d9c52315c2d135c324c2318559e60da89e3f27`, `65911e80a9b0199e84650c3aa91eafb8cca83b52` — added regression assertions for private co-op Legendary selection and decoding.

**Important test gate:** confirm host/guest clients accept captured legends, deterministic co-op simulation stays synchronized, co-op challenge and Arena remain correct, and Shadow Mewtwo/other private forms retain intended access rules. A malicious wire loadout can request a private legend because the relay treats this field as opaque; this is **not server-side authorization**. Do not claim that the custom Shadow Mewtwo identity is secure without additional relay-side checks. No deployment or production write.

### Build-failure triage from Cloudflare Pages log — 2026-11-04

- Owner supplied a Pages build log for **commit `42f5b924c2593085532c64851cf2f9d4087b2caa`**, timestamp `2026-11-04T08:23Z`. `npm run build` stopped at `tsc --noEmit` with errors, before Vite could build. This log predates the latest commits; do not treat it as the newest build result.
- The errors largely reflect custom playable families and the Shadow type omitted from exhaustive upstream tables. **Source fixes committed** on `Updated-11-3-2026`: `4e12393` abilities for Onix/Meowth; `f7e6978` Shadow TM affinity; `c3ffee6` Shadow special fallback; `e400cb4` spatial hazard weather type; `f48061a` and `e5268da` Shadow rendering palettes; `bc75315` Portuguese site Shadow type; `ed94965` unused selector import; `a328db8` gift reward exhaustiveness.
- **Locale fixes:** `484269a`, `58f9f68`, `7f96eb7`, `79c967e`, `160cd8c` remove incorrectly placed duplicate Palkia blurb entries and unrelated Shadow Mewtwo fields in Rift-domain dictionaries. `51a7727` completes missing Portuguese playable blurbs and Shadow type label.
- `d54542c` adds the missing `pokemonGift` fixture entry to the development Mystery Gift helper.
- **Not yet verified passing.** GitHub Actions for commit `d54542c` were pending/in progress at the time of this note. Inspect the latest failed run's actual errors before more fixes; do not assume the earlier log's list remains current. The accessible container cannot clone GitHub directly due to unavailable DNS, so use connected GitHub Actions logs/annotations or a user-provided updated log for the next TypeScript diagnostic.
- This is an integration debugging milestone prompted by the owner's real build log, superseding the earlier instruction to defer debugging until transfer: concrete live evidence now exists. Continue fixing on the migration branch only. Do not deploy or modify production main.

### Cloudflare Pages second TypeScript log — 2026-11-04

- Owner supplied another build log at **commit `20d8207a8bccdf90e25e6b90c52c6ce9d3d2e922`**, timestamp `2026-11-04T08:28Z`. The errors are narrowed to missing Shadow type translations in game/site language tables, and missing custom Pokémon blurbs in English, Spanish, French, and Traditional Chinese. No additional TypeScript errors were shown before those stopped the build.
- Fixed all eight affected files on `Updated-11-3-2026`: `src/i18n/{en,es,fr,zh}.ts` and `src/i18n/site/{en,es,fr,zh}.ts`. Each now has a Shadow type label, and the game dictionaries describe Meowth, Onix, Spiritomb, Palkia, and Shadow Mewtwo. Portuguese translations were already corrected in `51a7727` / `bc75315`.
- Commits: `e9c13ad`, `d778034`, `ec34a9a`, `b7ce621`, `420440a`, `35eb5d5`, `74a216f`, `a425a30`.
- **Still requires verification:** a fresh Cloudflare Pages or GitHub Actions build for at least `a425a30` should pass game TypeScript, then Vite and relay tests must pass. This note records source fixes, not a successful deployment.
