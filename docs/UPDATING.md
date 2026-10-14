# Updating DeutschLab

DeutschLab updates itself from GitHub Releases using the official Tauri v2 updater. Install it once; later
versions arrive inside the app (a notice on launch, or **Settings → Updates → Check for updates**).

Two different kinds of "signing" are involved. Do not confuse them:

| | Tauri updater signature | Apple code signing / notarization |
|---|---|---|
| Purpose | Proves an update was built by you | Lets Gatekeeper open the app without warnings |
| Needed? | **Yes, always.** Verification cannot be disabled | No. Needs a paid Apple Developer membership; **not used here** |
| Key | Your minisign key pair (free) | Apple certificate |

The app is **ad-hoc signed** (`signingIdentity: "-"`), which is what a free personal setup can do.

## 1. One-time signing setup

The public key is already in `src-tauri/tauri.conf.json` (`plugins.updater.pubkey`). The matching private key was
generated at `~/.tauri/deutschlab-updater.key` (no password). It is **not** in Git.

To make your own instead (this invalidates already-installed copies, which must then be reinstalled):

```bash
npx tauri signer generate -w ~/.tauri/deutschlab-updater.key      # add --password "" for none
cat ~/.tauri/deutschlab-updater.key.pub                           # paste into tauri.conf.json → plugins.updater.pubkey
```

**Back the private key up** (password manager). If it is lost, installed copies can never update again; you
would have to reinstall by hand with a new key. Never commit it.

## 2. GitHub secrets

Repo → Settings → Secrets and variables → Actions → *New repository secret*:

| Secret | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | the **contents** of `~/.tauri/deutschlab-updater.key` |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | the key's password (empty string if none; create the secret anyway) |

Or: `gh secret set TAURI_SIGNING_PRIVATE_KEY < ~/.tauri/deutschlab-updater.key` and
`gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --body ""`. `GITHUB_TOKEN` is provided automatically. Also ensure
Settings → Actions → General → Workflow permissions allows **read and write**.

## 3. Initial installation

1. Publish a first release (section 4), or build locally: `npm ci && npx tauri build --bundles app,dmg`.
2. Open the `.dmg`, drag **DeutschLab** into `/Applications`.
3. Gatekeeper (see below) will refuse the first launch of a downloaded copy: run
   `xattr -dr com.apple.quarantine /Applications/DeutschLab.app`, or right-click → Open (macOS 15+: System
   Settings → Privacy & Security → *Open Anyway*).

Your existing data is kept because the identifier `com.deutschlab.app` never changes: SQLite lives in
`~/Library/Application Support/com.deutschlab.app/`, the Gemini key in the Keychain. Updates replace only the
app bundle.

## 4. Publishing a future update

Releases run **only** for a pushed tag `vX.Y.Z` or a manual *Run workflow* (type `release`). Ordinary commits and
PRs never release.

```bash
git switch main && git pull
node scripts/bump-version.mjs 1.0.1        # syncs package.json, lock, tauri.conf.json, Cargo.toml/.lock, appInfo.ts
npm run test:agent                          # full gate must pass
git commit -am "Release 1.0.1" && git push
git tag v1.0.1 && git push origin v1.0.1    # starts .github/workflows/release.yml
```

The workflow verifies all versions match the tag, runs `tsc` + Vitest, builds Apple Silicon, signs the updater
bundle, and creates a **draft** release containing the `.dmg`, `DeutschLab.app.tar.gz`, its `.sig` and
`latest.json`. Review it on GitHub, then press **Publish release**. Only a published release is served by
`…/releases/latest/download/latest.json`, so installed apps see nothing until you publish. Write the release
notes in the release body: the in-app notice shows them.

## 5. How the app behaves

- Checks ~4 s after the database is ready (never delays launch), silently; failures are ignored.
- "Later" hides that version's notice (remembered in `localStorage`); a newer version, or a manual check, shows it again.
- Nothing is installed or restarted while a lesson or checkpoint is open. If one is started mid-download the app
  waits and offers **Restart now** when you are back on a normal screen. Lessons keep no unsaved state outside
  the database, which the update never touches.
- Bad signature, offline, failed download, or no release yet → plain message, nothing changed.

## 6. Gatekeeper limitations (no Apple Developer membership)

- A browser-downloaded DMG/app is quarantined and, being unnotarized, is blocked until you clear the quarantine
  (step 3 above). Installing a copy you built yourself or fetched with `curl` carries no quarantine flag.
- Updates downloaded by the in-app updater are not quarantined, so they open without the prompt.
- **Keychain:** each ad-hoc build has a different code identity. After an update macOS may ask once whether
  DeutschLab may use its stored Gemini key (choose *Always Allow*), or the key may need re-entering in
  Settings → AI. This is the expected cost of ad-hoc signing; progress and the database are unaffected. Paid
  Developer ID signing would remove it.

## 7. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Workflow fails "Version mismatch" | Run `node scripts/check-version.mjs vX.Y.Z`; use `bump-version.mjs` |
| Build error about missing private key | Secrets missing/misnamed (section 2) |
| App says no update, yet a release exists | Release still a draft, or `latest.json` missing from assets |
| "could not be verified" | Release signed with a different key than the app's `pubkey`; reinstall once with a build from the matching key |
| "Could not reach the update server" | Offline; or repo is private (the endpoint needs a public repo / public assets) |
| "damaged / can't be opened" | Quarantine flag: `xattr -dr com.apple.quarantine /Applications/DeutschLab.app` |
| Moved app to another folder | Update installs where the app lives; the folder must be writable by you |

## 8. Remaining manual steps

1. Add the two GitHub secrets.
2. Make sure the repo (or at least its releases) is public, or the app cannot fetch `latest.json`.
3. Back up `~/.tauri/deutschlab-updater.key`.
4. Push the first `v*` tag when you approve a release.
