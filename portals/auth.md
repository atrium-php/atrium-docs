# Auth

Sign-in and everything around it, on `auth.APP_MAIN_DOMAIN` (the main domain in [single-domain mode](/guide/single-vs-multi-domain)).

| | |
|---|---|
| Pages | `atrium::auth.*` — login, register, password reset, verification, 2FA challenge |
| Layout | `atrium::layouts.auth` |
| CSS / JS | `resources/css/auth.css`, `resources/js/auth.js` (your copies) |

Phone verification (OTP over SMS) and the email-verification grace period are optional parts of this flow — switch them with the [config below](#config-that-affects-this-portal).

## Login

`/login` → `atrium::auth.login`

- Email and password, with "Remember me for 30 days".
- 5 failed attempts (per email and IP) lock sign-in for 5 minutes.
- On success, in order:
  1. Phone not verified (with phone verification on) → a code is sent, then [phone verification](#phone-verification).
  2. 2FA on → the [2FA challenge](#two-factor-authentication).
  3. A pending account deletion inside its 30 days → cancelled, then the account portal.
  4. Otherwise → the user's own portal (`$user->redirect()`: backoffice for staff, app for users, a portal of your own for its role).

## Register

`/register` → `atrium::auth.register`

- Name, email, password and confirmation.
- **"Select the user type"** appears only when `registerable_portals` lists portals (see [make:subdomain](/guide/make-subdomain-command#self-registration)); picking one assigns that portal's role.
- **Phone number** only with phone verification on.
- Shown while Settings → General → Registration is **Open** — or **Invite only** with an [invitation](/packages/invitations) opened in the session; 404 otherwise. From an invitation the email is filled in and locked, "Select the user type" is hidden (the invitation brings the role) and the email counts as verified.

## Forgot / reset password

`/forgot-password` → `/reset-password/{token}`

- Phone or email tab (phone hidden while phone verification is off): request a 6-digit code, then enter it.
- Always the same "sent" message whether or not the address or number has an account, so nothing leaks.
- A verified code is exchanged for a standard Laravel reset token, leading to `/reset-password/{token}`.
- Resend has a live countdown.

## Phone verification

`/verify-phone` (needs `auth`)

Only with phone verification on; when it's off, the whole flow is skipped everywhere and phones count as verified.

- 6-digit code by SMS (the `PhoneCode` notification on the `sms` channel), resend and "edit number" each limited to 2 attempts.
- Then the 2FA challenge if enabled, otherwise the user's portal.

Atrium ships no SMS gateway: until you bind one, codes are written to the log (`LogSmsService`) — fine locally, but phone verification can't work for real users. Bind your provider to `Atrium\Core\Contracts\SmsService` (one method, `send($to, $message)`) — see [Core → Services you can swap](/packages/core#services-you-can-swap).

### Code rules

`otp` in the portal config:

| Key | Default | |
|---|---|---|
| `expires_minutes` | 10 (`OTP_EXPIRES_MINUTES`) | How long a code is valid |
| `max_attempts` | 5 | Wrong codes before a 5-minute lockout |
| `resend_cooldown` | 60 s | Minimum wait between resends |
| `resend_max_attempts` | 3 | Resends per lockout window |
| `resend_lockout_seconds` | 86400 (24 h) | Window before resends reset |

A new code invalidates any unused one of the same type.

## Email verification

`/verify-email` (needs `auth`, `phone.verified`)

- A grace period (`EMAIL_VERIFICATION_GRACE_DAYS`, default 7) lets a new user in before verifying; the page shows the days left. Afterwards, `email.grace` blocks app and backoffice and sends the user here.
- Same 6-digit code and resend rules as phone verification.

## Changing your email address

Started from the [Account profile](/portals/account#profile). The change doesn't apply at once:

1. The new address is stored as pending and a link is emailed to it.
2. The current address stays active (and you stay signed in) until the link is clicked.
3. `/verify-email-change/{token}` applies it — no sign-in needed, it works from any email client. The link expires after 48 hours.

## Two-factor authentication

Set up on the [Account portal](/portals/account#two-factor-authentication). On every sign-in after that:

`/two-factor-challenge` (only reachable mid-sign-in)

- A 6-digit TOTP code, or a single-use recovery code.
- On success: the same pending-deletion cancel and portal redirect as a normal sign-in.

## Config that affects this portal

In Atrium's portal config (`config/multidomain.php` once [published](/reference/config)):

| Key | Env | Default | |
|---|---|---|---|
| `phone_verification_enabled` | `PHONE_VERIFICATION_ENABLED` | `false` | The whole phone/OTP flow on or off |
| `phone_country_mode` | `PHONE_COUNTRY_MODE` | `single` | `single`: one fixed country code, no field; `multi`: users type their own |
| `phone_default_country_code` | `PHONE_DEFAULT_COUNTRY_CODE` | `+91` | The code used in `single` mode |
| `email_verification_grace_days` | `EMAIL_VERIFICATION_GRACE_DAYS` | `7` | Days before an unverified email blocks access |
| `registerable_portals` | — | `[]` | Portals a visitor can pick when registering |

## Language switcher

A floating switcher in the corner (these pages have no header) — same rules as [Landing](/portals/landing#language-switcher).

## Already signed in

Signed-in users who open this portal are sent to their own portal (the `guest` middleware), after the phone-verification check.
