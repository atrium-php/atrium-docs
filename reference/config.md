# Config Reference

Atrium's config ships inside its packages and is merged into your app. A new project has none of these files; Atrium's defaults apply. To change one, copy it into the project:

```bash
php artisan vendor:publish --tag=atrium-config    # config/multidomain.php, rate-limits.php, health.php
```

or create a file of the same name with only the keys you change — **a project file wins** over Atrium's, key by key. Published copies are tracked in `atrium-overrides.json` (see [Customising](/guide/customising#your-copies-of-atrium-files)).

## `multidomain` — portals and sign-in (core)

| Key | Env | Default | |
|---|---|---|---|
| `main_domain` | `APP_MAIN_DOMAIN` | `localhost` | The domain every portal's host comes from |
| `single_domain` | `APP_SINGLE_DOMAIN` | `false` | All portals on one host — see [Single vs Multi Domain](/guide/single-vs-multi-domain) |
| `sub_domains` | — | derived | Portal key → host (`app`, `backoffice`, `landing`, `account`, `auth`, `api`, plus [your own](/guide/make-subdomain-command)) |
| `registerable_portals` | — | `[]` | Portals a visitor can pick when registering — see [self-registration](/guide/make-subdomain-command#self-registration) |
| `page_style` | — | landing: `landing`, others `shared` | Error/maintenance design per portal — see [Error Pages](/guide/error-pages) |
| `email_verification_grace_days` | `EMAIL_VERIFICATION_GRACE_DAYS` | `7` | Days before an unverified email blocks app and backoffice |
| `phone_verification_enabled` | `PHONE_VERIFICATION_ENABLED` | `false` | The phone/OTP flow on or off |
| `phone_country_mode` | `PHONE_COUNTRY_MODE` | `single` | `single`: fixed country code; `multi`: users type their own |
| `phone_default_country_code` | `PHONE_DEFAULT_COUNTRY_CODE` | `+91` | The code used in `single` mode |
| `otp.*` | `OTP_EXPIRES_MINUTES` | see [Auth](/portals/auth#code-rules) | Code lifetime, attempts, resend limits |
| `setup.*` | `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_PASSWORD` | | The Super Admin and demo accounts `atrium:install` creates |

## `rate-limits` (core)

Per-route throttles: `login`, `register`, `downloads`, `links` — each `max` attempts per `decay` seconds.

## `health` (core)

| Key | Env | |
|---|---|---|
| `token` | `HEALTH_TOKEN` | `/health` (on every host) returns only the overall status (200 ok/warning, 503 failed); send this token (`X-Health-Token` header or `?token=`) to get each check's detail |
| `cache_seconds` | `HEALTH_CACHE_SECONDS` | How long results are cached (default 30) |
| `checks`, `thresholds`, `disks` | — | Which checks run and their limits |
| `notify` | `HEALTH_NOTIFY_MAIL` | Who is emailed when a check fails |

`php artisan health:check` runs the checks from the command line; Backoffice → System health shows them.

## `modules` (your project)

`config/modules.php` is yours: one `MODULE_*` switch per module. See [Modules](/guide/modules).

## Module config

Modules bring their own config the same way — merged under the module's name, with a project file of the same name winning:

| File | Module | |
|---|---|---|
| `maintenance` | maintenance | `global` (`APP_MAINTENANCE`), `exempt_portals` — see [Maintenance Mode](/guide/maintenance-mode) |
| `activitylog` | activity | spatie/laravel-activitylog's config |
| `backup` | backup | spatie/laravel-backup's config (`BACKUP_*`) |
| `sanctum` | api | Sanctum's config |
| `translation-loader` | language | spatie/laravel-translation-loader's config |

## User model contract

The `portal` middleware and the post-sign-in redirect rely on two methods of the user model, both on `Atrium\Core\Models\User`:

```php
$user->isStaff(): bool       // backoffice vs app
$user->redirect(): string    // where to send this user
```

Override them in `App\Models\User` to plug in your own rules.

## Middleware aliases

| Alias | | |
|---|---|---|
| `guest` | Sends signed-in users to their portal | |
| `portal:{staff\|user\|key}` | Portal access — see [Roles & Permissions](/guide/roles-and-permissions#gate-bypass) | |
| `phone.verified` | Requires a verified phone (passes while phone verification is off) | |
| `email.grace` | Blocks after the email-verification grace period | |
| `staff` | Staff only | |
| `licensed:{module}` | Requires a valid licence for a paid module — see [Build (and sell) a module](/guide/build-a-module#selling-it) | |
| `ability`, `abilities` | Sanctum token abilities | api module |
