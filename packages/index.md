# Packages

Atrium is a set of Composer packages, released together under one version number:

| Package | What it is | |
|---|---|---|
| [`atrium-php/core`](/packages/core) | Portals, auth, account, roles and permissions, settings, feature flags, health checks, the module system | always installed |
| [`atrium-php/skeleton`](/packages/skeleton) | The app a new project starts from (`composer create-project`) | your project |

And eight modules — each its own package of type `atrium-module`. A new project has **none of them**: install the ones you need from Backoffice → Modules or with `php artisan module:install` — see [Modules](/guide/modules).

| Module | Package | What it adds | On once installed |
|---|---|---|---|
| `activity` | [`atrium-php/activity`](/packages/activity) | Activity log: who changed what, with comments and reactions | yes |
| `api` | [`atrium-php/api`](/packages/api) | Versioned JSON API with Sanctum tokens and an access policy | no |
| `backup` | [`atrium-php/backup`](/packages/backup) | Scheduled database and file backups, on-demand runs and downloads | yes (runs once `BACKUP_ENABLED=true`) |
| `billing` | [`atrium-php/billing`](/packages/billing) | Stripe subscriptions: plans, Checkout, Billing Portal, webhooks | no |
| `currency` | [`atrium-php/currency`](/packages/currency) | Currencies, exchange rates and money formatting | yes |
| `language` | [`atrium-php/language`](/packages/language) | Languages, RTL, URL locales and database translations | yes |
| `maintenance` | [`atrium-php/maintenance`](/packages/maintenance) | Per-portal maintenance mode with a branded page | yes |
| `media` | [`atrium-php/media`](/packages/media) | Media library: uploads, image sizes, attachments to any model | yes |

Every module depends only on core — never on another module — and core never depends on a module.

Installing, switching on and off, uninstalling, backing up and restoring: see [Modules](/guide/modules).

## What a module may ask of your user model

Some modules need something on `App\Models\User`. Add it when you install the module — the Modules page and `atrium:doctor` tell you when an enabled module's need is missing, and a module's code isn't removed while your user model still uses its trait:

| Module | Needs on `App\Models\User` |
|---|---|
| `api` | implements `Laravel\Sanctum\Contracts\HasApiTokens`, uses `Laravel\Sanctum\HasApiTokens` |
| `media` | uses `Atrium\Media\Concerns\HasMedia` |

## Your own modules

- **Inside one project:** `php artisan make:module Invoices` → `app/Modules/Invoices`, registered in `config/modules.php`.
- **As a package** (to reuse across projects, share or sell): `php artisan atrium:make-package acme/invoices` — see [Build (and sell) a module](/guide/build-a-module).

Both use the same `ModuleProvider` contract as Atrium's own modules.
