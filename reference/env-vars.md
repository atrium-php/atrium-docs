# Environment Variables

Atrium's own variables, on top of Laravel's standard ones (database, mail, queue, …) in `.env.example`.

Marked ⚙: can also be set on Backoffice → Settings, which wins over `.env` — see [Settings and `.env`](/portals/backoffice#settings-and-env).

## Portals

| Var | Default | |
|---|---|---|
| `APP_MAIN_DOMAIN` | `localhost` | The domain every portal's host comes from (e.g. `yourapp.test`) |
| `APP_SINGLE_DOMAIN` | `false` | All portals on one host — see [Single vs Multi Domain](/guide/single-vs-multi-domain) |
| `SESSION_DOMAIN` | `null` | Shared session cookie for [SSO](/guide/sso-sessions), e.g. `.yourapp.test`; `null` in single-domain mode |

## Install

| Var | Default | |
|---|---|---|
| `ADMIN_NAME` | `Admin` | The Super Admin `atrium:install` creates |
| `ADMIN_EMAIL` | `admin@example.com` | |
| `ADMIN_PASSWORD` | empty | Empty: generated and printed once |
| `DEMO_PASSWORD` | empty | Password for `atrium:install --demo` accounts (empty: generated) |

## Modules

| Var | Default | |
|---|---|---|
| `MODULE_{KEY}` | the package's default | Switch an installed [module](/guide/modules#enable-and-disable) on or off — only once `config/modules.php` has an entry reading it |
| `MODULE_REMOVE_CODE` | `true` | Uninstalling a module also removes its package with Composer |
| `MODULE_COMPOSER` | `composer` | The Composer command the queue worker runs |
| `COMPOSER_HOME` | `storage/framework/composer` | Composer's home for the web server / queue worker |
| `MODULE_MAINTENANCE_WINDOW` | `true` | Maintenance mode while Composer changes `vendor/` |
| `MODULE_BACKUPS_DISK` ⚙ | `FILESYSTEM_DISK` | Where module backups go |
| `MODULE_BACKUPS_PASSWORD` | `BACKUP_ARCHIVE_PASSWORD`, else from `APP_KEY` | Module backup encryption |
| `MODULE_BACKUPS_KEEP`, `MODULE_BACKUPS_MAX_AGE_DAYS` | `1`, `90` | Module backup retention |

## Module settings

Read only once the module is installed. Each module's page lists its own.

| Var | Default | |
|---|---|---|
| `APP_MAINTENANCE` | `false` | Global maintenance switch — every portal, backoffice included ([Maintenance Mode](/packages/maintenance)) |
| `MEDIA_DISK` ⚙, `MEDIA_PRIVATE_DISK`, `MEDIA_IMAGE_DRIVER` | `local`, `local`, `gd` | Media module storage (shared files, private files) and image driver |
| `API_RATE_LIMIT` | `60` | API module: requests per minute per token |
| `BACKUP_ENABLED` ⚙ | `false` | Backup module: actually run scheduled backups |
| `BACKUP_DISKS` ⚙, `BACKUP_NOTIFY_MAIL` ⚙, `BACKUP_MAX_STORAGE_MB` ⚙, `BACKUP_ARCHIVE_PASSWORD` | | Where backups go, who is told, archive encryption |
| `STRIPE_KEY` ⚙, `STRIPE_SECRET` ⚙, `STRIPE_WEBHOOK_SECRET` ⚙, `CASHIER_CURRENCY` ⚙ | | Billing module (Laravel Cashier) |
| `BILLING_STARTER_PRICE` ⚙, `BILLING_PRO_PRICE` ⚙, `BILLING_TRIAL_DAYS` ⚙ | | Billing module plans |

## Health

Read by the [Health module](/packages/health).

| Var | Default | |
|---|---|---|
| `HEALTH_TOKEN` | empty | Unlocks per-check detail on `/health` |
| `HEALTH_CACHE_SECONDS` | `30` | How long a health report is reused |
| `HEALTH_NOTIFY_MAIL` | empty | Who is emailed when a check fails |

## Feature flags

| Var | |
|---|---|
| `PENNANT_KILLED` | Comma-separated flag names forced off everywhere (kill switch) |

## Sign-in flow

See the [Auth portal](/portals/auth) for how each is used.

| Var | Default | |
|---|---|---|
| `PHONE_VERIFICATION_ENABLED` | `false` | The phone/OTP flow on or off |
| `PHONE_COUNTRY_MODE` | `single` | `single` (fixed code) or `multi` (users type their own) |
| `PHONE_DEFAULT_COUNTRY_CODE` | `+91` | The code used in `single` mode |
| `EMAIL_VERIFICATION_GRACE_DAYS` | `7` | Days before an unverified email blocks access |
| `OTP_EXPIRES_MINUTES` | `10` | How long a code is valid (also shown in the SMS/email) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | | Needed to actually send SMS codes |

Without Twilio credentials, SMS sending fails quietly (logged) — fine locally, but phone verification can't work for real users until they're set.

## Search

| Var | Default | |
|---|---|---|
| `SCOUT_DRIVER` | `database` | `database` searches the tables directly; `meilisearch` for large tables — see [Search](/guide/search) |
