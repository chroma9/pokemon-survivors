# Private admin console (chroma9 fork)

This feature lives on the **coop-mode** branch until tested. Never commit the administrator token to GitHub, Cloudflare Pages variables, or browser source code.

## Worker secret

From the `relay` folder, after pulling the branch:

```powershell
npm run typecheck
npm run deploy:private
npx wrangler secret put GAME_ADMIN_TOKEN --config wrangler.private.jsonc
```

Use a strong random token, e.g. generate locally with:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Enter that token into the Wrangler prompt (not into the repository or chat). The Worker stores it separately from its diagnostic `ADMIN_TOKEN`.

## Browser console

Open the `coop-mode` Cloudflare Pages branch deployment. In the browser developer console:

```js
await ps.password('YOUR_TOKEN')
await ps.admin()
await ps.money(20000)
await ps.unlockFamily()
await ps.unlockShiny()
```

During an active co-op run:

```js
await ps.spawn('chansey', 10)
await ps.spawn('chansey', 10, 'Orion')
```

The untargeted shared spawn defaults to the first non-host player; a name targets a matching teammate. A solo spawn appears near your character. Limit: 1–20 enemies per request. Co-op commands are authenticated by the Worker and injected into lockstep; normal players cannot send the privileged tick entry.

```js
await ps.restoreBackup() // restores the snapshot from before the first save-changing cheat
ps.logout()
```

`ps:adminSaveBackup` is a local browser backup and does not restore anything on other devices. This is an initial feature; test on the preview site with a second player and verify that both clients show the same enemies before merging into `main`.

The verified token only gates the console and shared server actions. It cannot prevent someone from using their own browser developer tools to modify local saves.
