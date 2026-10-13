# Account

Self-service for every signed-in user, on `account.APP_MAIN_DOMAIN` (`/account` in [single-domain mode](/guide/single-vs-multi-domain)).

| | |
|---|---|
| Pages | `atrium::accounts.*` — profile, security, export, settings, 2FA setup |
| Layout | `atrium::layouts.accounts` |
| CSS / JS | `resources/css/account.css`, `resources/js/account.js` (your copies) |

End users and staff both use this portal — there's no `portal:*` restriction, unlike app and backoffice.

## Profile

`/` → `atrium::accounts.index`

Inline-edit sections, one open at a time:

- **Name** — saves immediately.
- **Email** — doesn't change on save: see [Changing your email address](/portals/auth#changing-your-email-address). A pending change can be cancelled or its link resent from here.
- **Phone** — only with phone verification on. Saving clears the verification, sends a new code and redirects to `/verify-phone`.
- **Delete account** — asks for the current password. See [Account deletion](#account-deletion).

## Security

`/security` → `atrium::accounts.security`

**Password** — change it, confirming the current one.

**Sign-in sessions** — every active session: device and browser, IP, last activity, with the current one marked. Sign out one other session, or all other sessions. Both rotate the `remember_token`, so a "remember me" cookie in a signed-out browser can't sign itself back in; your current browser's cookie is reissued so you stay signed in.

## Data export

`/export` → `atrium::accounts.export`

- **Request an export** — a queued job builds a zip (`profile.csv`, `sessions.csv`) and emails a link.
- **Download** — the link brings you back here; re-enter your password to get a one-time download token (valid 60 seconds). The file is served from `GET /export/{token}` on the account domain, outside the `auth` middleware, because the link may be opened from an email client with no session.
- Exports expire and are pruned **7 days** after they're built; downloads are capped at **3 per 24 hours**.

## Account deletion

From [Profile](#profile), with the current password.

- Requesting deletion **signs you out everywhere** and schedules deletion **30 days** later; an email confirms the date.
- **To cancel**, sign in again within those 30 days — signing in (or passing the 2FA challenge) cancels it and sends a confirmation.
- After 30 days the account is **anonymised**, not hard-deleted, so foreign keys and the audit trail stay intact: the name becomes "Deleted User", the email an unreachable placeholder, phone, 2FA and password are wiped. Atrium fires `AccountDeleting` before and `UserAnonymized` after — listen to them to clean up your own data.

## Two-factor authentication

`/two-factor-setup` (needs `auth`, `phone.verified`)

- **Set up** — scan the QR code with any TOTP app, confirm with a 6-digit code, and save the 8 single-use recovery codes.
- **Manage** — show or hide recovery codes, regenerate them, reconfigure, or turn 2FA off.
- Recovery codes are used up at the [2FA challenge](/portals/auth#two-factor-authentication).

## Settings

`/settings` → `atrium::accounts.settings`

- **Preferred language** — with the Language module on and two or more active languages. It decides the language on app, account and backoffice, overriding the URL (see [Localization & RTL](/packages/language)). Saving reloads the page so direction and everything else update.
- **Timezone** — always shown. Dates across the app display in it; empty uses the app's default timezone.

## Scheduled cleanup

Atrium schedules two daily jobs — keep the queue worker and scheduler running:

| Job | When | What |
|---|---|---|
| `ProcessPendingAccountDeletions` | 02:00 | Anonymises accounts whose 30 days are up |
| `PruneAccountExports` | 03:00 | Deletes expired export files and rows |
