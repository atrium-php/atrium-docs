# Getting Started

## Requirements

- PHP 8.4+ and Laravel 13 (installed for you)
- A [Flux UI Pro](/reference/flux-ui) licence
- Node.js, to build the CSS/JS
- A local domain with subdomains, e.g. [Laravel Herd](https://herd.laravel.com) serving `yourapp.test` and `*.yourapp.test`

## Install

```bash
composer create-project atrium-php/skeleton my-app
cd my-app
php artisan atrium:install          # --pick to choose modules, --demo for demo accounts
npm install && npm run build
```

::: tip Pre-release
Atrium isn't on Packagist yet. Internal test builds (`1.0.0-alpha.N`) install from the private `atrium-php` GitHub repositories — see the release notes on GitHub for the exact command.
:::

`create-project` asks for your Flux Pro credentials the first time (see [Flux UI Pro](/reference/flux-ui)). A new project uses SQLite; switch `DB_CONNECTION` in `.env` for MySQL or PostgreSQL.

`atrium:install` switches modules on, migrates, seeds the roles and the **Super Admin** (`ADMIN_EMAIL`, default `admin@example.com`) and prints the generated password once. It's safe to run again.

## What you own, what Atrium owns

```
my-app/
├── app/                   your code: App\Models\User, providers, your own modules (app/Modules)
├── config/                Laravel's config + config/modules.php (module switches)
├── resources/css, js, assets   copies of Atrium's portal CSS/JS and logo — yours to edit
├── routes/web.php         your routes (Atrium registers its portals itself)
├── atrium-overrides.json  tracks every copy of an Atrium file (commit it)
└── vendor/atrium-php/     Atrium: core + modules — never edited, upgraded with composer update
```

Change Atrium through its extension points, never by editing `vendor/` — see [Customising without forking](/guide/customising) and [Upgrading](/guide/upgrading).

## Configure your domain

```sh
APP_MAIN_DOMAIN=yourapp.test
SESSION_DOMAIN=.yourapp.test
```

Every portal's host comes from `APP_MAIN_DOMAIN`:

- `yourapp.test` — landing
- `auth.yourapp.test` — sign in, register, password reset, verification, 2FA
- `account.yourapp.test` — profile, security, data export
- `app.yourapp.test` — your application
- `backoffice.yourapp.test` — staff area

Point all of them at the project's `public/` folder (with Herd: `herd link yourapp` inside the project, plus `herd secure yourapp` for HTTPS), then sign in at `auth.yourapp.test` as the Super Admin.

Don't want subdomains? See [Single vs Multi Domain](/guide/single-vs-multi-domain).

## Check the install

```bash
php artisan atrium:doctor     # "Healthy" when everything is in place
php artisan about             # installed Atrium versions and modules
composer dev                  # server, queue worker and Vite together
```

## Next steps

- [Packages](/packages/) — core, the skeleton and every module, and switching modules on and off.
- [Customising without forking](/guide/customising) — the extension points.
- [Roles & Permissions](/guide/roles-and-permissions) — Super Admin, Admin and portal roles.
- [make:subdomain](/guide/make-subdomain-command) — add a portal of your own.
- The portals: [Auth](/portals/auth), [Account](/portals/account), [App](/portals/app), [Backoffice](/portals/backoffice).
