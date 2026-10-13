# Modules

Atrium is `atrium-php/core` plus optional modules. Each first-party module is its own Composer package (`atrium-php/{module}`, type `atrium-module`); the skeleton installs all of them.

| Module | Package | What it adds | On by default |
|---|---|---|---|
| `activity` | `atrium-php/activity` | [Activity log](/guide/activity-log): who changed what, with comments and reactions | yes |
| `api` | `atrium-php/api` | Versioned JSON API with Sanctum personal access tokens | no |
| `backup` | `atrium-php/backup` | Scheduled database and file backups, on-demand runs and downloads | yes (backups run once `BACKUP_ENABLED=true`) |
| `billing` | `atrium-php/billing` | Subscriptions through Stripe Checkout and the Billing Portal (Cashier) | no |
| `currency` | `atrium-php/currency` | [Currencies, exchange rates and money formatting](/guide/currency) | yes |
| `language` | `atrium-php/language` | [Languages, RTL, URL locales and database translations](/guide/localization) | yes |
| `maintenance` | `atrium-php/maintenance` | [Per-portal maintenance mode](/guide/maintenance-mode) with a branded page | yes |
| `media` | `atrium-php/media` | Media library: uploads, image conversions and attachments | yes |

Core itself always runs: portals, auth, account, roles and permissions, settings, feature flags, health checks and the module system.

## Switching a module on or off

Two places, the second wins:

1. **`.env`** — `MODULE_BILLING=true` (the defaults live in `config/modules.php`).
2. **Backoffice → Modules** (`modules.manage`) — a runtime switch saved in the database. Switching back to what `.env` says removes the override.

Or pick them during install: `php artisan atrium:install --modules=activity,billing` or `--pick`.

A switched-off module registers nothing — no routes, nav entries, middleware, Livewire components or schedule. Its tables and data stay, so switching it back on restores everything. Its **permissions are always seeded**, so roles keep their assignments either way.

From your own code, check before touching a module:

```php
if (Module::enabled('billing')) { /* ... */ }
```

```blade
@module('billing') ... @endmodule
```

## What a module may ask of your user model

Some modules need something on `App\Models\User`. The skeleton's user model already has them; `atrium:doctor` tells you when an enabled module's need is missing:

| Module | Needs on `App\Models\User` |
|---|---|
| `api` | implements `Laravel\Sanctum\Contracts\HasApiTokens`, uses `Laravel\Sanctum\HasApiTokens` |
| `media` | uses `Atrium\Media\Concerns\HasMedia` |

## Not installing a module at all

A module you never want can be removed from the project entirely: switch it off, remove anything of yours that uses it (for `media` and `api`, their lines in `App\Models\User` above), then `composer remove atrium-php/{module}` and `php artisan atrium:doctor`.

## Your own modules

- **Inside one project:** `php artisan make:module Invoices` → `app/Modules/Invoices`, registered in `config/modules.php`.
- **As a package** (to reuse across projects, share or sell): `php artisan atrium:make-package acme/invoices` — see [Build (and sell) a module](/guide/build-a-module).

Both use the same `ModuleProvider` contract as Atrium's own modules.
