# Private cloud trainer profiles

Status: **preview implementation; validate builds and multiplayer before merging into main**.

## Features

- Persistent trainer UUID and unique handle (`a-z`, digits, underscores; 3–20 characters)
- Editable display name (maximum 24 characters)
- Account registration and sign-in with a separate password (minimum 12 characters)
- Cloudflare Durable Object account storage
- PBKDF2-SHA-256 password verifier, per-account random salt, 210,000 iterations
- 256-bit random session bearer tokens, stored hashed on the server, with a 30-day expiry
- Logout revokes the current token
- Public profile lookup by handle; no password/session information returned
- Verified account identity and name on co-op room entry, distinct from browser guest IDs
- **Separate** from `GAME_ADMIN_TOKEN`: creating a trainer account does not grant `ps` administrator commands.

## How to deploy

```powershell
cd C:\pokemon-survivors\pokemon-survivors
git switch coop-mode
git pull origin coop-mode
npm ci
npm run build
npm test -- --run src/coop/trainerAuth.test.ts
cd relay
npm ci
npm run typecheck
npm run deploy:private
```

The Worker migration `v5` creates a new `TrainerAccounts` SQLite-backed Durable Object. Do not erase or roll back persistent object state after creating player accounts. The separate `GAME_ADMIN_TOKEN` secret remains intact.

Visit the Cloudflare Pages `coop-mode` preview, click **Trainer Profile** in the top-right, and create an account. Use a unique strong password; do not use the separate administrator password. Sign in from a second browser to confirm the same trainer identity is displayed. Try public lookup by handle and editing your display name. Rejoin a co-op room after signing in to present the verified account name.

**Limitations**: Account records are cloud-backed, but `ps:save` progression still lives in localStorage and is not synced to the account. No email-based password recovery is implemented, so record the password securely. Browser session tokens are kept in localStorage; users should use trusted browser profiles. Profiles currently show trainer ID, handle, name and creation date; richer statistics and other players' save details are not included. The regular game's original Clerk account features remain independent of these private accounts.

## Rollout checklist

1. Run frontend and relay typechecks and tests locally.
2. Deploy the Worker before the updated Cloudflare Pages preview.
3. Register two test accounts, sign in on separate browsers, confirm unique handles and public lookup.
4. Join the same co-op room and verify each name comes from its authenticated account.
5. Confirm logout and expired/invalid sessions are refused on new connections.
6. Confirm `ps.admin()` is not affected by logging into a trainer account.
7. Keep `main` unchanged until tests pass.

## Private referral rewards (preview)

New accounts can register with `?ref=<inviter-handle>`. The server stores the inviter's immutable account ID and awards the newcomer a Friendship Egg. A referred player qualifies after three *distinct rankable run reports*; the inviter's account receives the existing milestone gifts for 1, 3, 5, and 10 qualified friends. Trainer Profile shows an invite link, counts, friends, and a **Collect referral gifts** action.

**Security/testing limitation:** these are currently browser-reported run completions, not authoritative verified match results. The server deduplicates run IDs and requires the logged-in trainer, but a modified client can forge distinct reports. Do not promise fraud-resistant referral rewards until the relay verifies co-op results or an authenticated replay verifier exists.

**Save limitation:** reward IDs prevent repeated claiming in a single existing save, but the private cloud account does not yet synchronize its gameplay save across devices. The gift delivery bridge applies gifts to local saves. Please keep accounts in the test environment and do not treat this as a production-ready anti-abuse system.

Verify existing-account registration vs first-time referral behavior, original referral milestones, 3 run reports and duplicates, local gift application with a full incubator, logout and re-login, and multi-device behavior before releasing. Do not merge `main` during this testing.
