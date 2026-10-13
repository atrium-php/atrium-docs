# Backoffice

The staff area, on `backoffice.APP_MAIN_DOMAIN` (`/backoffice` in [single-domain mode](/guide/single-vs-multi-domain)).

| | |
|---|---|
| Pages | `atrium::backoffice.*`, plus each module's own |
| Layout | `atrium::layouts.backoffice` |
| CSS / JS | `resources/css/backoffice.css`, `resources/js/backoffice.js` (your copies) |

## Access

Atrium wraps it in `['auth', 'phone.verified', 'email.grace', 'portal:staff']`. `portal:staff` sends non-staff to the app portal. Staff is decided by `$user->isStaff()` (the `privilege` column on Atrium's user model).

Inside, every page and action checks its own permission, and the sidebar only lists pages the user can open (see [Roles & Permissions](/guide/roles-and-permissions)).

## Core pages

| Page | Path | Permission |
|---|---|---|
| Dashboard — users, staff, roles, permissions, newest users | `/` | staff |
| Roles, and each role's permissions | `/roles`, `/roles/{role}/permissions` | `roles.*` |
| Permissions catalog | `/permissions` | `permissions.*` (Super Admin only to change) |
| Users and their roles | `/users` | `users.view`, `users.assign-roles` |
| Settings — timezone, brand, module settings | `/settings` | `settings.edit` |
| Modules — switch modules on and off, licence keys | `/modules` | `modules.manage` (Super Admin) |
| Feature flags | `/feature-flags` | `feature-flags.manage` |
| System health | `/system-health` | `health.view` |

## Module pages

Each appears while its [module](/packages/) is on (users also get Account → Billing and Account → API tokens from those modules):

| Page | Path | Module |
|---|---|---|
| [Activity log](/packages/activity) | `/activity` | activity |
| [Languages](/packages/language), [Translations](/packages/language#translations) | `/languages`, `/translations/{scope?}` | language |
| [Currencies](/packages/currency) | `/currencies` | currency |
| [Maintenance](/packages/maintenance) | `/maintenance` | maintenance |
| [Media Library](/packages/media) | `/media` | media |
| [Backups](/packages/backup) | `/backups` | backup |
| [Billing](/packages/billing) | `/billing` | billing |
| [API Access](/packages/api) | `/api` | api |

## Settings

One page for every app-wide setting, built from a registry: core's fields (default timezone, brand name, logo, favicon, accent colour, "Powered by Atrium") plus whatever enabled modules add (URL mode, Google Translate key, currencies, …). One **Save** for the whole page; secret fields are stored encrypted, never sent back to the page and never written to the activity log.

Your own modules add fields with `Module::contribute('settings.fields', [new SettingField(...)])` — see [Build (and sell) a module](/guide/build-a-module#the-module-contract).

## Adding your own pages

From a module (recommended): a `routes/backoffice.php` in the module is loaded inside the backoffice group, and `Module::contribute('backoffice.nav', [...])` adds the sidebar link. `php artisan make:module` and `atrium:make-package` scaffold both.

To change an existing page, see [Customising](/guide/customising) — `Platform::component('atrium::backoffice.users', ...)` swaps it for your own.
