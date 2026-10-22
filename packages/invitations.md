# Invitations

| | |
|---|---|
| Package | `atrium-php/invitations` — module `invitations`, on once installed |
| Namespace | `Atrium\Invitations\` |
| Depends on | core (uses [Access Control](/packages/access-control)'s Users page and [Notifications](/packages/notifications) when they're there) |
| Permissions | `invitations.manage` — send, resend, revoke and list invitations |
| Pages | Backoffice → Access Control → **Invitations**; an *Invite user* button on the Users page; the emailed link on the auth portal (`/invitations/{token}`) |
| Settings | Settings → General → Registration: **Invite only**, and how long links work |
| Uninstall | backup **optional** |

Invite people by email, with the role they get when they accept, and run sign-up as **invite only**: no public sign-up page, but invited people can still create their account.

**With the module off or uninstalled nothing breaks**: a stored *Invite only* acts as *Closed*, the links stop working, and the Users page loses its button.

## Install

```bash
php artisan module:install invitations
```

Or Backoffice → Modules → *Available* → *Install*. Nothing to add to your user model.

## Inviting

*Invite user* (on Invitations or the Users page) takes:

- **Email addresses** — one or many, separated by commas, spaces or new lines (up to 50 at a time). Invalid ones, ones that already have an account (assign them a role on the Users page instead) and ones already invited are skipped, and the result says which and why.
- **Role** (optional) — only roles whose every permission you hold yourself, so nobody can invite someone above their own level; the **Super Admin** role only by a Super Admin. Roles decide who gets into the backoffice ([Backoffice access](/guide/roles-and-permissions#backoffice-access)): invite with *Staff* or *Admin* for backoffice people. No role: the person gets what normal sign-up gives (*Role for new accounts*).
- **Message** (optional) — quoted in the email.

Each person gets an email with an *Accept invitation* link. The result also shows every link to copy — the only time it's visible: only a hash of the token is stored.

One person may send 50 invitation emails an hour (`invitations.rate_limit`). Sending, resending, revoking and accepting are logged in the `invitations` log ([Activity](/packages/activity)).

## The Invitations page

Tabs **Pending**, **Accepted**, **Expired** and **Revoked**, with the role, who sent it and when it expires / was accepted.

- **Resend** — a new link (the old one stops working) and a fresh expiry; works on expired and revoked invitations too. The new link is shown once to copy.
- **Revoke** — the link stops working.

Invitations with the Super Admin role are only listed to Super Admins, like Super Admin accounts. While registration is **Closed** the page warns that invited people without an account can't sign up.

## Accepting

The link (`/invitations/{token}` on the auth portal, throttled like other emailed links) keeps the invitation in the visitor's session, then:

| Situation | What happens |
|---|---|
| No account for the address | → **Sign up**, with the email filled in and locked and the role shown. The account is created with the role, and its email counts as verified. |
| An account exists | → **Sign in**. Once fully signed in (after 2FA too), the invitation is accepted. |
| Signed in as that address | Accepted right away. |
| Signed in as someone else | "Sign out first" — nothing is accepted. |
| Expired, revoked, already used, or unknown | A page saying so. |
| Registration **Closed** and no account | "Sign-up is closed". |

Only an account with the invited address can accept. Whoever sent it is told — *Someone accepted your invitation*, by email and in-app (with [Notifications](/packages/notifications); they can switch it off).

## Registration modes

Settings → General → **Registration**:

| Mode | Sign-up page |
|---|---|
| Open | for everyone; an invitation fills in the email and adds the role |
| **Invite only** (this module) | only with a valid invitation; 404 otherwise, and no *Create one* links |
| Closed | for nobody, not even with an invitation |

Next to it, **Invitation links work for (days)** — 7 by default, 1 to 90 (`INVITATIONS_EXPIRY_DAYS`).

## Configuration

`config('invitations')`, from the package's `config.php`:

| Key | `.env` | Default | |
|---|---|---|---|
| `expiry_days` | `INVITATIONS_EXPIRY_DAYS` | `7` | How long a link works; the setting wins |
| `prune_days` | `INVITATIONS_PRUNE_DAYS` | `90` | Expired and revoked invitations are deleted this long after they ended (`invitations:prune`, daily 03:40); accepted ones are kept. `0` keeps them |
| `rate_limit` | — | `50` per hour | Invitation emails per person |
| `max_per_invite` | — | `50` | Addresses in one invite |

## For module authors

- Core asks `Atrium\Core\Contracts\Invitations` whether invitations exist and which one the visitor opened (`pending()` → `PendingInvitation` with `email` and `roleName`); `NullInvitations` without this module. `AppSetting::registrationMode()` returns `open`, `invite-only` or `closed`.
- Access Control's Users page takes header components from the `access-control.users.header` extension point (see [Access Control](/packages/access-control#adding-to-the-users-page)).
- `Atrium\Invitations\Services\InvitationService` (`invite()`, `resend()`, `revoke()`, `accept()`) for inviting from your own code.

## Deleting

An anonymized account's accepted invitation (it holds the old address) is deleted, and invitations it sent lose their sender.

## Tables

`invitations` — email, role, a reserved `team_id` (for a future Teams module), token hash, message, sender, expiry, accepted / revoked times, the account that accepted.
