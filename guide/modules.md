# Modules

Atrium's optional features are **modules**: each its own Composer package, installed only when a project wants it. A new project starts with core and the one required module, Access Control.

| Module | Package | What it adds |
|---|---|---|
| [Access Control](/packages/access-control) | `atrium-php/access-control` | Roles, permissions and the users list — **required**: always installed, always on |
| [Activity](/packages/activity) | `atrium-php/activity` | Audit trail of who changed what, with comments and reactions |
| [Analytics](/packages/analytics) | `atrium-php/analytics` | Signups, active users and logins on the dashboard, with a detailed Analytics page |
| [Announcements](/packages/announcements) | `atrium-php/announcements` | Banners, one-time modals and a What's new page, per portal and role, scheduled |
| [API](/packages/api) | `atrium-php/api` | Token-authenticated JSON API with a Super Admin access policy |
| [Backups](/packages/backup) | `atrium-php/backup` | Scheduled database and file backups |
| [Billing](/packages/billing) | `atrium-php/billing` | Stripe subscriptions |
| [Currencies](/packages/currency) | `atrium-php/currency` | Currencies, exchange rates and money formatting |
| [Feature flags](/packages/feature-flags) | `atrium-php/feature-flags` | The backoffice page to switch feature flags |
| [System health](/packages/health) | `atrium-php/health` | `/health` endpoint for monitors, System health page, status-change emails |
| [Impersonation](/packages/impersonation) | `atrium-php/impersonation` | "Log in as" a user — audited, time-limited, sensitive actions blocked |
| [Import / Export](/packages/import-export) | `atrium-php/import-export` | CSV / XLSX exports of every table, user imports with a dry run |
| [Invitations](/packages/invitations) | `atrium-php/invitations` | Invitations by email with a role, invite-only sign-up |
| [Languages](/packages/language) | `atrium-php/language` | Languages, RTL, URL locales and database translations |
| [Email templates](/packages/mail-templates) | `atrium-php/mail-templates` | Reword every mail per language and restyle them all, with variables, preview and test sends |
| [Maintenance](/packages/maintenance) | `atrium-php/maintenance` | Per-portal maintenance mode |
| [Media](/packages/media) | `atrium-php/media` | Media library with uploads, image sizes and attachments |
| [Notifications](/packages/notifications) | `atrium-php/notifications` | Notification bell and inbox, channel preferences per user, messages from the backoffice |
| [Security](/packages/security) | `atrium-php/security` | Sign-in history, new-device alerts, lockout, required 2FA, password policy, session limits, Backoffice IP allowlist |
| [Teams](/packages/teams) | `atrium-php/teams` | Workspaces with team roles, a team switcher, App data scoped to the current team |
| [Webhooks](/packages/webhooks) | `atrium-php/webhooks` | Signed outgoing webhooks for app events, with retries and a delivery log |

A module has two layers, and Atrium keeps track of both:

- **Code** — the package in `vendor/` (or your own module in `app/Modules`), recorded in `composer.json`.
- **Data** — its tables, settings, permissions and files in this database, recorded in the `modules` table.

## Backoffice → Modules

![Backoffice → Modules with available modules to install](/screenshots/backoffice-modules.png)

Super Admin only (`modules.manage`). Every module the project has, plus Atrium's other modules as *Available*:

- counts and a filter — all, enabled, disabled, not installed — and a search box;
- each module with its version, install date, what it **requires** and what **requires it**;
- a menu per module: switch back to the `.env` default, its backups, *Back up now*, *Uninstall…*;
- **Recent activity**: the latest installs, uninstalls, restores and backups, with who did them.

Installs, uninstalls, restores and backups run **on the queue** and the page refreshes itself while they run. Keep a queue worker running; when nothing processes the queue the page says *Background jobs are waiting*.

## Install

**Available** → *Install*. In the background, Composer adds the package (`composer require`), then its tables are created, its data seeded and its permissions granted to Super Admin and Admin.

From the command line:

```bash
php artisan module:install media
php artisan module:install acme/invoices --constraint=^1.2    # another vendor's module, by package name
```

While Composer rewrites `vendor/` (a few seconds to a minute), the site is in maintenance mode with a page that says *A module is being installed or removed* and reloads by itself — requests in that window would otherwise fail.

Some modules need something on your user model — the page and `atrium:doctor` say what. Today: [API](/packages/api#install) (Sanctum's `HasApiTokens`) and [Media](/packages/media#install) (`HasMedia`).

## Enable and disable

Switching a module off doesn't uninstall it: it stops registering routes, pages, nav links, listeners and scheduled jobs, while its tables, data and permissions stay. Switching it back on needs no setup.

Three layers, the last wins:

1. **The package's default** — on for most modules; API and Billing start off.
2. **`config/modules.php`** — add an entry to control it from `.env`, e.g. `'media' => (bool) env('MODULE_MEDIA', true),` then `MODULE_MEDIA=false`. A new project's file is empty; without an entry the package's default applies.
3. **Backoffice → Modules** — a runtime switch saved in the database. *Reset to default* removes the override.

A module that isn't installed in this database is always off, whatever the switches say.

From your own code, check before touching a module:

```php
if (Module::enabled('billing')) { /* ... */ }
```

```blade
@module('billing') ... @endmodule
```

## Uninstall

*Uninstall…* opens the **impact report** before anything happens:

- every table with its row count, the files and their size, settings, permissions and the roles holding them;
- rows in other tables linked to the module's records (activity entries, media attachments, notifications);
- installed modules that **require** it — uninstall them too (each backed up per its own policy), or keep it;
- its **backup policy**, and anything **blocking** the uninstall (Billing while subscriptions are active).

Confirm with your password and the module's name typed. The module is switched off at once; a queued job then:

1. **backs it up** per its policy — and stops, leaving the module off but installed, if the backup fails;
2. deletes its files, linked rows, settings, feature flag values, permissions and tables;
3. **removes its code** with `composer remove` (the packages only it needed go too).

You get an email when it's done. The module stays listed as *Not installed*, with *Install fresh* and its backups.

| Backup policy | Meaning | Modules |
|---|---|---|
| **required** | always backed up; the uninstall stops if the backup fails | Activity, Billing, Language, Media (with files) |
| **optional** | offered, ticked by default | API, Currency, Feature Flags, Maintenance |
| **none** | nothing worth keeping | Backup, Health |

**Required modules** — a package can mark itself required (`"required": true` under `extra.atrium`): it has no switch and no *Uninstall* action, and stays on whatever `.env` or an override says. Atrium's own: Access Control.

::: warning Servers deployed from git
Removing a module's code changes `composer.json` and `composer.lock` **on that server**. Make the same change in your repository (`composer remove atrium-php/<module>`), or the next deploy brings the package back. Its data stays uninstalled; the Modules page shows the code as still installed with a *Remove code* button. Set `MODULE_REMOVE_CODE=false` to keep packages installed after an uninstall and remove them through your normal deploy instead. See [Deploying](/guide/deploying).
:::

From the command line:

```bash
php artisan module:uninstall media --pretend      # the impact report only
php artisan module:uninstall media                # asks you to type the name
php artisan module:uninstall currency --cascade --no-backup --force
```

`--keep-code` leaves the package installed; `--remove-code` also deletes a project module's `app/Modules/{Name}` (not in production).

## Backups and restore

A **module backup** holds one module's data — its rows, linked rows in shared tables, permissions with the roles that had them, settings, and its files when the policy includes them. It's an AES-256 zip on your default filesystem disk, readable on MySQL, PostgreSQL and SQLite alike. Module backups are separate from the full-site backups of the [Backup module](/packages/backup) and work without it.

- Taken automatically before an uninstall, or on demand with *Back up now* / `php artisan module:backups media --create`.
- Listed per module on the Modules page and by `php artisan module:backups media`; download or delete them there.
- Retention: the newest backup per module is kept, none older than 90 days — they hold personal data (`MODULE_BACKUPS_KEEP`, `MODULE_BACKUPS_MAX_AGE_DAYS`, `--prune`).
- Encrypted with `MODULE_BACKUPS_PASSWORD`, else `BACKUP_ARCHIVE_PASSWORD`, else a key derived from `APP_KEY` — restoring needs the same one.

**Restore** brings an uninstalled module back from a backup: *Install & restore* (or *Restore* on a backup) on the Modules page, or:

```bash
php artisan module:install media                     # asks: fresh, or restore a backup
php artisan module:install media --restore=latest
php artisan module:restore media --backup=2026-10-03-142500
```

The module is migrated to exactly the backup's version, its rows come back with their ids, and newer migrations run on them — a backup from an older release is upgraded like a live install. References to records that are gone (a deleted user) become empty, or the row is skipped. Permissions go back to the roles that still exist. Secrets encrypted under another `APP_KEY` are dropped, and tables the module never restores (API tokens) stay empty. Derived data — search indexes, image sizes — is rebuilt. A backup from a newer release is refused, and a failed restore leaves the module uninstalled, never half restored.

## Other modules

**Your own** — `php artisan make:module Invoices` creates one in `app/Modules`; `php artisan atrium:make-package acme/invoices` creates one as its own package. See [Build (and sell) a module](/guide/build-a-module).

**Another vendor's** — install it with Composer (`composer require acme/invoices`, then `php artisan atrium:upgrade`), or list it in `config/module-lifecycle.php` so it appears under *Available*:

```php
'catalog' => [
    ['module' => 'invoices', 'package' => 'acme/invoices', 'label' => 'Invoices',
     'description' => 'Invoices and payments.', 'icon' => 'document-text'],
],
```

Its package must be installable here — on Packagist, or from a repository in your `composer.json`.
