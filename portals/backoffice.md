# Backoffice

The staff area, on `backoffice.APP_MAIN_DOMAIN` (`/backoffice` in [single-domain mode](/guide/single-vs-multi-domain)).

| | |
|---|---|
| Pages | `atrium::backoffice.*`, plus each module's own |
| Layout | `atrium::layouts.backoffice` |
| CSS / JS | `resources/css/backoffice.css`, `resources/js/backoffice.js` (your copies) |

![The backoffice: sidebar with Access Control and System groups, dashboard](/screenshots/backoffice-dashboard.png)

The app, backoffice and account portals share one shell: a fixed sidebar (collapse it to icons on desktop; a drawer on mobile), a header with the theme switch and your user menu (the only place to log out), and a full-width page. Staff switch portals from the top of the sidebar.

## Access

Atrium wraps it in `['auth', 'phone.verified', 'email.grace', 'portal:staff']`. `portal:staff` sends non-staff to the app portal. Staff is decided by `$user->isStaff()`: holding the `backoffice.access` permission through a role (Super Admin, Admin, Staff or one of your own) — see [Backoffice access](/guide/roles-and-permissions#backoffice-access).

Inside, every page and action checks its own permission, and the sidebar only lists pages the user can open (see [Roles & Permissions](/guide/roles-and-permissions)).

## Core pages

| Page | Path | Permission |
|---|---|---|
| Dashboard — users, staff, roles, permissions, newest users | `/` | staff |
| Settings — one page per group: General, then each module's | `/settings/{group}` | per group (General: `settings.edit`) |
| Modules — install, switch on and off, uninstall, back up and restore modules; licence keys ([Modules](/guide/modules)) | `/modules` | `modules.manage` (Super Admin) |

## Module pages

Each appears while its [module](/packages/) is on (users also get Account → Billing and Account → API tokens from those modules):

| Page | Path | Module |
|---|---|---|
| [Roles](/packages/access-control), each role's permissions | `/roles`, `/roles/{role}/permissions` | access-control (always installed) |
| [Permissions catalog](/packages/access-control) | `/permissions` | access-control |
| [Users](/packages/access-control) and their roles | `/users` | access-control |
| [Handover](/guide/roles-and-permissions#handover) (Super Admin only) | `/handover` | access-control |
| [Activity log](/packages/activity) | `/activity` | activity |
| [Languages](/packages/language), [Translations](/packages/language#translations) | `/languages`, `/translations/{scope?}` | language |
| [Currencies](/packages/currency) | `/currencies` | currency |
| [Maintenance](/packages/maintenance) | `/maintenance` | maintenance |
| [Media Library](/packages/media) | `/media` | media |
| [Backups](/packages/backup) | `/backups` | backup |
| [Feature flags](/packages/feature-flags) | `/feature-flags` | feature-flags |
| [System health](/packages/health) | `/system-health` | health |
| [Billing](/packages/billing) | `/billing` | billing |
| [API Access](/packages/api) | `/api` | api |

## Settings

**Settings** in the sidebar opens one page per group — **General** from core, then one per enabled module that has settings (Languages, Currencies, Media, Backups, Billing, …). A group only shows to someone allowed to change at least one thing in it; `/settings` opens the first such group.

**General** (`settings.edit`):

| Section | Settings |
|---|---|
| Region | Default timezone; **date format** (`Oct 19, 2026`, `19 Oct 2026`, `19/10/2026`, `10/19/2026`, `2026-10-19`) and **time format** (12 or 24 hours), used for dates across every portal and in emails |
| Brand | Name, logo, favicon, accent colour, "Powered by Atrium" — see [Theming](/guide/theming) |
| Registration | **Open**, **invite only** (with [Invitations](/packages/invitations)) or **closed** (no sign-up page, no "Create one" links); a **portal role every new account gets**; with Invitations, how long invitation links work |
| Contact | **Support email** — shown on error pages, and set as Reply-To on Atrium's emails |
| Module backups (`modules.manage`) | The **disk** module backups go to |

Each page has one **Save** for its fields, and saves only what you changed. Secret fields are stored encrypted, never sent back to the page and never written to the activity log.

### Settings and `.env`

Some settings replace a `.env` value — Media's disk, the Backup schedule, the Stripe keys, … A stored setting **wins over `.env`**; leave a field empty (or pick *As in .env*) to fall back to it — the page shows what `.env` currently gives. Values are applied when the app boots, so queue workers and the scheduler see them after their next restart. `php artisan config:cache` never writes them into the cache.

### From your own module

```php
use Atrium\Core\Support\Modules\Module;
use Atrium\Core\Support\Settings\SettingField;

Module::contribute('settings.groups', [[
    'key' => 'invoices', 'label' => 'Invoices', 'icon' => 'document-text',
    'description' => 'Numbering and reminders.', 'order' => 70,
]]);

Module::contribute('settings.fields', [
    fn () => new SettingField(
        key: 'invoices_prefix',
        type: SettingField::TYPE_TEXT,
        label: __('Number prefix'),
        permission: 'invoices.manage',
        group: 'invoices',
        section: __('Numbering'),       // optional heading inside the page
        config: 'invoices.prefix',      // optional: the stored value overrides this config key
    ),
]);
```

Types: `TYPE_TEXT`, `TYPE_TEXTAREA`, `TYPE_NUMBER`, `TYPE_BOOLEAN`, `TYPE_SELECT`, `TYPE_RADIO`, `TYPE_CHECKBOXES`, `TYPE_EMAILS`, `TYPE_SECRET`, `TYPE_JSON`. With `config`, `toConfig: fn ($value, $current) => …` shapes the config value and `fromConfig: fn ($original) => …` labels the `.env` fallback; `Settings::original('invoices.prefix')` gives the value without the setting. A self-saving Livewire card goes into a group with `Module::contribute('backoffice.settings.cards', [['component' => 'invoices::settings', 'group' => 'invoices']])`.

## Adding your own pages

From a module (recommended): a `routes/backoffice.php` in the module is loaded inside the backoffice group, and `Module::contribute('backoffice.nav', [...])` adds the sidebar link. `php artisan make:module` and `atrium:make-package` scaffold both.

To change an existing page, see [Customising](/guide/customising) — `Platform::component('access-control::users', ...)` swaps it for your own.
