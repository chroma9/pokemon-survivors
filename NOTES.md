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
