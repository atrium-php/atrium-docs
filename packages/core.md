# Core

| | |
|---|---|
| Package | `atrium-php/core` |
| Namespace | `Atrium\Core\` |
| Always on | yes — not a module, can't be switched off |
| Depends on | Laravel 13, Livewire 4, Flux (free), spatie/laravel-permission, Laravel Pennant, Laravel Scout, google2fa, Twilio SDK |
| Config | `multidomain`, `rate-limits`, `module-backups`, `module-lifecycle` — see [Config Reference](/reference/config) |

Everything every Atrium project has, whichever modules are on.

## What's inside

- **Portals** — landing, [auth](/portals/auth), [account](/portals/account), [app](/portals/app), [backoffice](/portals/backoffice), each on its own subdomain or [all on one host](/guide/single-vs-multi-domain), with [SSO](/guide/sso-sessions) across them and [`make:subdomain`](/guide/make-subdomain-command) for your own.
- **Sign-in** — login, registration, password reset, optional phone OTP, email verification with a grace period, TOTP two-factor with recovery codes.
- **Account self-service** — profile, sessions, data export, account deletion with a 30-day cancel window and anonymisation.
- **[Roles & Permissions](/guide/roles-and-permissions)** — Super Admin and Admin, portal roles, per-page permission checks.
- **Settings** — Backoffice → Settings, one page per group, built from a registry modules add groups and fields to; date format, registration, support email, white-label brand ([Settings](/portals/backoffice#settings), [Theming](/guide/theming)).
- **[Feature flags](#feature-flags)** and the **[health check](#health-checks)** contract.
- **[Error pages](/guide/error-pages)**, the audit trail producer (`Auditable`, `Audit` — recorded by the [Activity module](/packages/activity)), [timezones](#timezones).
- **The module system** — discovery, switches, the Modules page, licensing — see [Packages](/packages/) and [Build (and sell) a module](/guide/build-a-module).
- **Install and upgrade tooling** — `atrium:install`, `atrium:upgrade`, `atrium:doctor`, copies tracking ([Commands](/reference/commands)).

## Public API

Classes tagged `@api` are safe to build on within a major version; everything else is `@internal` and may change in any release (see [Customising](/guide/customising#public-api)). The main ones:

| | |
|---|---|
| `Platform` | `useUserModel()`, `component()`, `page()`, `routeMiddleware()` |
| `Models\User`, `Role`, `Permission`, `AppSetting` | Base user model and the permission models |
| `Support\Modules\Module`, `ModuleProvider` | The module system |
| `Contracts\Currencies`, `Languages`, `SmsService`, `LicenseGate`, `UpgradeStep` | Swap or implement services |
| `Events\AccountDeleting`, `UserAnonymized`, `Audited` | React to Atrium |
| `Concerns\Auditable`, `Support\Audit` | Put things on the audit trail |
| `Support\Money`, `Casts\MoneyCast` | Money as integers ([Currency](/packages/currency)) |
| `Support\Brand` | White-label settings |
| `Support\Features\*` | Feature flags |
| `Support\Health\Check`, `Result`, `Status` | Health checks |
| `Support\Licensing\*` | Licensing for paid modules |
| `Support\Settings\SettingField`, `Settings` | Settings page fields, config-backed settings |
| `Support\DisplayDate` | Dates in the user's timezone and the chosen format (also `->forUserDate()`, `->forUserTime()`, `->forUserDateTime()` on Carbon) |
| `Support\Toast`, `Concerns\SortsTable`, `ThrottlesActions`, `Anonymizable` | UI and model helpers |

## Services you can swap

Core resolves these through contracts; bind your own in a service provider:

| Contract | Default | Replaced by |
|---|---|---|
| `SmsService` | Twilio | — |
| `Currencies` | plain `USD 30.00` formatting, no conversion | the [Currency module](/packages/currency) |
| `Languages` | the app locale only | the [Language module](/packages/language) |

```php
$this->app->bind(\Atrium\Core\Contracts\SmsService::class, \App\Services\MySms::class);
```

## Timezones

Everything is stored in UTC; conversion happens only when displaying, through a Carbon macro:

```php
$user->created_at->forUser()->translatedFormat('l, d F Y H:i');
```

`forUser()` uses the user's `users.timezone`, else the app default (Backoffice → Settings → Default timezone, `settings.edit`), else `config('app.timezone')`. Users pick their own on Account → Settings.

## Feature flags

Built on Laravel Pennant. A flag is a class in `app/Features`, decided **per portal** (`PortalFlag`) or **per user** (`UserFlag`):

```bash
php artisan make:flag NewCurrencyPicker          # per portal
php artisan make:flag BetaReports --user         # per user
```

```php
use Atrium\Core\Support\Features\Flags;

Flags::active(NewCurrencyPicker::class);   // current portal / signed-in user
```

```blade
@flag(\App\Features\NewCurrencyPicker::class) ... @endflag
```

`PENNANT_KILLED=a,b` forces flags off everywhere. The skeleton ships two examples in `app/Features`. To switch flags from the backoffice, per portal or user, install the [Feature Flags module](/packages/feature-flags).

## Health checks

Core defines what a health check is — `Atrium\Core\Support\Health\Check`, returning a `Result` with a `Status` — and the `health.checks` extension point, so any module can ship a check:

```php
Module::contribute('health.checks', [MyCheck::class]);
```

The [Health module](/packages/health) runs them: `/health`, `php artisan health:check`, Backoffice → System health and status-change emails. Without it, `/up` (Laravel's liveness check) is still there.
