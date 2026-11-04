# Private migration preview — validation and production safety

**Branch:** `Updated-11-3-2026` only. **Never merge or deploy production `main` as part of this procedure.**

## Current status

- Game client compiled and rendered in the Cloudflare Pages branch preview (owner observation).
- GitHub Actions at `5b4f3507be` passed full CI and the dedicated private relay/port checks.
- The isolated preview Worker configuration exists at `relay/wrangler.preview.jsonc` and deploy script `npm run deploy:preview`.
- No Cloudflare Worker preview deployment, two-client co-op, cross-browser Trainer Account smoke test, or production merge is verified.
- After `5b4f3507be`, additional account-safety commits require fresh CI confirmation.

## Isolation requirements (non-negotiable)

1. Deploy **`chroma9-survivors-coop-preview`**, not `chroma9-survivors-coop` (live) or upstream's `ps-coop-dev`.
2. Ensure preview Worker has **new Durable Objects** for `SHARDS`, `VAULT`, `MATCHMAKER` and `TRAINER_ACCOUNTS`. Do not connect to production Trainer Account storage. Preview registrations and grants must use dummy identities and disposable progress.
3. Set **`VITE_COOP_URL` in the Cloudflare Pages branch preview build environment** to the exact Worker URL printed by Wrangler. It is a Vite build-time variable, so a Pages rebuild is required after changing it.
4. The preview Worker presently allows only `https://updated-11-3-2026.chroma9-survivors.pages.dev` in `ALLOWED_ORIGINS`. Check the *actual* page origin in the browser before testing; do not enable an indiscriminate CORS wildcard.
5. Never copy live Worker secrets, production Durable Object state, or authentic player passwords into preview. A separate, test-only signing secret should be used wherever an endpoint requires one.
6. A successful Pages build alone does **not** deploy the Worker. A responding Worker alone does **not** prove that authentication or gameplay works.

## One-time deploy (requires owner's Cloudflare access and approval)

From a local checkout of this branch:

```powershell
git switch Updated-11-3-2026
git pull origin Updated-11-3-2026
cd relay
npm ci
npm run typecheck:private
npm run test
npm run deploy:preview
```

Confirm the Wrangler output shows the **preview Worker name** and a preview `workers.dev` URL, not the live private Worker.

For admin-only preview tests, set a **unique disposable** `GAME_ADMIN_TOKEN` Worker secret with `npx wrangler secret put GAME_ADMIN_TOKEN --config wrangler.preview.jsonc` from `relay/`. Do not reuse or paste the live administrator credential into the preview environment. Without this secret, the preview Worker intentionally refuses admin grant and spawn commands; basic rooms and Trainer registration can still be tested. Keep the secret out of git, build variables, and documentation.

In Cloudflare Pages for the migration preview, set `VITE_COOP_URL` to that URL. Rebuild only the **preview branch**. Verify that the displayed preview build SHA matches the expected branch head.

**Deployment is intentionally not automated from GitHub pushes.** First deploy requires explicit owner approval.

## Smoke tests before release

- [ ] Pages preview's co-op button and Trainer Account panel appear, and the browser reports no CORS error.
- [ ] Worker responds; create/join a private room from two separate browser sessions. Disconnect/reconnect each and check that lobby names are server-verified, not spoofed.
- [ ] Start a two-player run; verify deterministic movement, guest joining, room completion and referral run accounting. Test playable Palkia and other captured Legendary selections.
- [ ] Register **two new disposable Trainer Accounts**. Earn or hatch progress on one; refresh and log into another browser to confirm save portability without cross-account leakage.
- [ ] Switch A → B while a save request is pending; confirm A's gifts, eggs, companion, and save do not land in B.
- [ ] Equip and unequip companions (explicit `No companion`), grant normal/shiny Mystery Gifts using **preview-only** authorized administration, and confirm idempotent redemption.
- [ ] Check supporter rewards and ticket delivery, referral milestones and co-op run credits.
- [ ] Verify Palkia's raised small and large locked silhouettes, shiny Onix portraits, Shadow Mewtwo custom form, and Spiritomb abilities.
- [ ] Review Cloudflare Worker exceptions and Durable Object logs. Stop if migrations or authentication indicate a production resource.

## Release gate

Require green game, private relay, Playwright and determinism checks on the release SHA; complete the smoke tests; review upstream delta and replay-rule compatibility; then request a separate, explicit **approval to merge to `main` and deploy the live private Worker**.

The upstream RULES 45 invulnerability changes are not yet merged. Do **not** bump the fork to RULES 45 by copying upstream hashes: the live fork uses RULES 43 and migration version 44 has a custom simulation and frozen 43 replay verifier.
