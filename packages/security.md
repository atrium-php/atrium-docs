# Security

| | |
|---|---|
| Package | `atrium-php/security` — module `security`, on once installed |
| Namespace | `Atrium\Security\` |
| Depends on | core |
| Permissions | `security.manage` — Backoffice → Security and Settings → Security (Admin has it) |
| Pages | Backoffice → Security (sign-ins, locked accounts); *Recent sign-ins* on Account → Security; a banner while two-factor is due; Backoffice → Settings → Security |
| Config | `security` (below); every value also on Settings → Security |
| Uninstall | backup **optional** — settings and lock state are restored; sign-in history and old password hashes never are |

Account protection in one place: who signed in from where, alerts for new devices, lockout after failed sign-ins, two-factor required for chosen roles, password rules, idle timeouts and session limits, and an address allowlist for the Backoffice.

**With the module off or uninstalled** core's own behaviour applies: its password rules (8+ characters, upper and lower case, a number, a symbol, not breached), its per-email and per-address throttling, no lockout, no allowlist, no timeouts.

## Install

```bash
php artisan module:install security
```

Or Backoffice → Modules → *Available* → *Install*.

## Sign-in history

Every sign-in and failed try is recorded: email, address, device (*Chrome on macOS*), and why it failed — *wrong password*, *wrong two-factor code*, *account locked*. For someone with two-factor on, the sign-in counts once the code is right. Support viewing as someone ([Impersonation](/packages/impersonation)) never counts.

- **Account → Security → Recent sign-ins**: the person's own last 20.
- **Backoffice → Security**: everything, searchable by email or address, *Failed only*.
- Kept **90 days** (0 keeps it), pruned nightly by `security:prune`.

### New-device alert

A sign-in from a device not used in the last 90 days sends *"New sign-in to your account"* (mail + in-app) with a link to Account → Security. Not on someone's very first sign-in. It's on by default; people can turn it off in their notification preferences (*Security → A sign-in from a new device*).

## Lockout

After **5** failed sign-ins to one account (wrong password or wrong two-factor code) within **15 minutes**, **from any address**, the account is locked for 15 minutes — even the right password is refused — and its owner gets a mail (always sent). A successful sign-in starts the count again; Backoffice → Security lists locked accounts with **Unlock**. 0 attempts switches lockout off.

This adds to core's throttling (per email + address, and per address), which stays.

## Required two-factor

**Require two-factor for** chosen roles (e.g. Super Admin, Admin, Staff). From the first time it applies to someone they have **7 days** (0–90) with a banner on every page; after that every page leads to two-factor setup until it's on. Sign-out, Account → Security and the setup page stay reachable.

## Passwords

Replaces core's rules everywhere a password is set (sign-up, reset, Account → Security):

| Setting | Default |
|---|---|
| Minimum length | 8 (8–128) |
| Upper- and lowercase, a number, a symbol | on |
| Not found in data breaches ([Have I Been Pwned](https://haveibeenpwned.com/Passwords), k-anonymity: the password never leaves the server) | on |
| Refuse the current and the last … passwords | 5 (0 allows reuse) |
| Ask for a new password every … days | 0 = never |

Old passwords are kept only as hashes. With expiry on, the clock starts when the person is first seen after it's switched on; when it runs out, pages lead to Account → Security until the password is changed. Current [NIST guidance](https://pages.nist.gov/800-63-3/sp800-63b.html) advises against forced changes — leave it at 0 unless a policy requires it.

## Sessions

- **Idle timeout per portal** (Backoffice, App, Account; minutes, 0 = never): signed out after that long without a request, back to sign-in with a message.
- **Sessions per person** (0 = no limit): signing in once more signs out the oldest other sessions. Needs the `database` session driver (the default).

## Backoffice allowlist

**Addresses that can reach the Backoffice** — one IP address or CIDR range per line, IPv4 or IPv6 (`203.0.113.0/24`, `2001:db8::/32`). Empty: any address. Anyone else gets a 403 on the Backoffice; the other portals aren't affected. Saving a list that doesn't include your own address is refused.

Shut out anyway (your address changed)? From the server:

```bash
php artisan security:allow-ip 198.51.100.7   # add an address or range
php artisan security:allow-ip --list
php artisan security:allow-ip --clear         # empty the list: any address again
```

Behind a load balancer or proxy, make sure Laravel sees the real client address ([trusted proxies](https://laravel.com/docs/requests#configuring-trusted-proxies)).

## Configuration

`config('security')`, from the package's `config.php` — Settings → Security overrides each:

| Key | `.env` | Default |
|---|---|---|
| `two_factor_roles` | — | `[]` |
| `two_factor_grace_days` | `SECURITY_2FA_GRACE_DAYS` | `7` |
| `password.min_length` | `SECURITY_PASSWORD_MIN_LENGTH` | `8` |
| `password.mixed_case` / `numbers` / `symbols` / `uncompromised` | — | `true` |
| `password.history` | `SECURITY_PASSWORD_HISTORY` | `5` |
| `password.expires_days` | `SECURITY_PASSWORD_EXPIRES_DAYS` | `0` |
| `lockout_attempts` | `SECURITY_LOCKOUT_ATTEMPTS` | `5` |
| `lockout_minutes` | `SECURITY_LOCKOUT_MINUTES` | `15` |
| `idle_minutes.backoffice` / `app` / `account` | `SECURITY_IDLE_BACKOFFICE` / `_APP` / `_ACCOUNT` | `0` |
| `max_sessions` | `SECURITY_MAX_SESSIONS` | `0` |
| `backoffice_ips` | `SECURITY_BACKOFFICE_IPS` (comma-separated) | `[]` |
| `history_days` | `SECURITY_HISTORY_DAYS` | `90` |

## While support views as someone

With [Impersonation](/packages/impersonation) on, unlocking accounts is refused, the viewer is never sent to two-factor setup or a password change, and nothing is recorded as a sign-in.

## For module authors

Core pieces this module uses — usable without it:

- `Atrium\Core\Contracts\LoginGuard` — asked by the sign-in page before the password check; `NullLoginGuard` never refuses.
- Events `Atrium\Core\Events\PasswordChanged`, `TwoFactorFailed`, `TwoFactorPassed`.
- `Atrium\Core\Support\Passwords::rules(?User)` — the rule list for a new password; extension point **`password.rules`** adds closures `fn (?User $user) => rule|null`.
- Extension point **`account.security.cards`** — Livewire components below the sessions on Account → Security, `[component, order]`.
