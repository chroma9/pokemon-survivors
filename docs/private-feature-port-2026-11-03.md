# Private feature port — 2026-11-03

## Ground rules

- Foundation: pedrobarretto/pokemon-survivors main at commit `0079e657811ff8a0fa4ae9969135fbd4e0c28a4a` (upstream RULES 44 and subsequent TM UI fix).
- Target integration branch: `Updated-11-3-2026`.
- Reference implementation: this repository's `main` branch (working production), not the prior rebuild branches.
- Do not overwrite newer upstream mechanics with older fork files wholesale; adapt integration points and preserve RULES 44, map biomes, co-op changes, Dojo and new UI.
- Never merge or deploy to production `main` until tests pass and the owner approves.
- Admin authority must be enforced server-side through relay verification, not usernames or client localStorage alone.
- Protect user profiles, gifts, balances and saved progress during migration.

## Requested features

| Feature | Reference on production main | Port checklist |
| --- | --- | --- |
| Trainer Account system | `relay/src/trainerAccounts.ts`, `src/trainerAccounts.ts`, `src/ui/privateTrainer.ts`, `relay/src/index.ts` | Authentication, registration, sync/revisions, profile management, account UI, Worker bindings, persistence tests |
| Production admin commands | `src/privateAdmin.ts`, `relay/src/index.ts`, private relay modules | Relay-authorized access, command guards, token lifecycle, spawn/money/gifts/broadcast and all currently supported commands, rejection tests |
| Onix / Steelix | `src/data/hatchlings.ts`, sprites and generated sprite metadata | Character definition, evolution, shiny sprites, tier ordering, unlock/saves |
| Meowth / Persian | `src/data/hatchlings.ts`, sprite assets | Character definition, evolution, portraits, playable moves and eggs |
| Chroma9 Shadow Mewtwo | Private Mewtwo modules and legend definitions | Preserve exact private form, restrictions and visuals; authorization should be server-backed where security matters |
| Palkia | `src/data/domains/palkia.ts`, `src/data/legends.ts`, Rift and boss code | Rift domain, boss phases, sprites, unlock and public availability, Pokédex, translations |
| Dark Pulse | Fork move declarations/attack code | Recipients, animation, upgrades and damage |
| Shadow Ball | Fork move declarations/attack code | Orb art, collision, upgrades and recipients |
| Spacial Rend | `src/game/legendaryMoves.ts`, `src/data/legendaryMoves.ts` | Attack, visual fissure, audio, upgrade and Palkia integration |
| Dark Nova | Fork boss/hazard rendering code | Shadow orb, explosion, hazard and screenshake; verify exact current implementation |

## Acceptance gates

1. Check feature parity against the working production `main`; record missing and intentionally excluded features.
2. Integrate account storage and secured relay first, with tests for authorization and save persistence.
3. Port Pokémon and their sprites/data one family at a time.
4. Port moves with tests and visual checks.
5. Validate single-player, co-op, save migration, gifts, Rift battles, mobile layouts and production builds.
6. Deploy only after explicit approval.

## Status

2026-11-03: clean upstream branch created. Porting work not yet validated. This checklist is an inventory, not a claim that any feature is implemented.

## Phase 1 checkpoint — backend and staged browser modules

- Added `relay/src/trainerAccounts.ts` from working production `main`.
- Ported Trainer Account and authenticated administration HTTP handlers into the newer upstream `relay/src/index.ts`, retaining the upstream room and Arena routes.
- Extended `relay/src/env.ts` with `TRAINER_ACCOUNTS`, `TRAINER_AUTH_LIMIT` and `GAME_ADMIN_TOKEN`.
- Added `relay/wrangler.private.jsonc` (private Durable Object namespace + v5 migration). Secrets are **not** stored in Git.
- Staged `src/trainerAccounts.ts`, `src/privateAdmin.ts` and `src/ui/privateTrainer.ts` from production for adaptation.

### Not yet complete

- **No build or runtime tests have run.** New upstream interfaces may require TypeScript adaptations.
- Client UI, startup cloud synchronization and privileged console entry points are not yet wired into upstream `src/main.ts` and `src/ui/title.ts`.
- Live-room spawn and observatory endpoints are **intentionally excluded** from the first backend port because newer upstream room/shard interfaces require review.
- Private Trainer Account tokens must be integrated with the new co-op client and relay handshake before private sign-in can replace Clerk in our production flow.
- Do not deploy until the Wrangler Durable Object binding and secrets are checked for the target environment.


## Phase 1 follow-up checkpoint — UI, co-op and automated checks

- Added a **Private Trainer Account** row in upstream's Trainer Card; native Clerk profile UI remains available.
- Wired cloud-save event syncing and session resume from `src/main.ts`.
- Exposed server-verified production admin console commands, excluding unported live-room spawn and observatory.
- Adapted the private Trainer Account page to the new UI API. The old gift redemption and companion/shiny picker screens cannot be reused directly; their UI port is still pending. A read-only account gift count is available.
- Extended shared room protocol, client, relay identity, and Arena queue to recognize private Trainer Account auth. Existing Clerk and guest protocols remain supported.
- Updated co-op and Arena entry gates to accept an authenticated Trainer Account.
- Added regression tests for private auth tokens and co-op client token selection.
- Added `.github/workflows/private-port.yml` for branch-only unit tests, TypeScript and relay checks (no deploy step).

**Validation:** Changes committed only to `Updated-11-3-2026`. Successful GitHub Actions checks have not yet been confirmed. End-to-end UI, co-op, token revocation, saved data, and relay deployment tests remain required.
