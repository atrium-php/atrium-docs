# Commands

## Install and upgrade

| Command | |
|---|---|
| `atrium:install` | First-run setup: app key, migrations, roles and the Super Admin, defaults. Safe to re-run. `--modules=a,b` or `--pick` to choose which installed modules are switched on, `--demo` for demo accounts (never in production), `--fresh` to start over, `--force` for production. Alias: `app:setup`. |
| `atrium:upgrade` | After `composer update`: migrations, one-off upgrade steps, finishing the install of newly added module packages, refresh of untouched copies, cache clear — see [Upgrading](/guide/upgrading). `--force` in deploy scripts. |
| `atrium:doctor` | Checks the project: versions, pending work, stale copies, module switches, the user model. Exits 1 when something is broken. |
| `about` | Laravel's `about`, with installed Atrium versions and modules. |

## Modules

See [Modules](/guide/modules).

| Command | |
|---|---|
| `module:install {module}` | Install a module: `composer require` its package when the code isn't here (`--constraint=^1.2`; a package name works too), then its tables, data and permissions. For a module uninstalled earlier with backups, asks *fresh* or *restore* — `--fresh`, `--restore=latest\|<timestamp>`. `--force` in production. |
| `module:uninstall {module} --pretend` | The impact report: tables and row counts, files, settings, permissions and roles, linked rows, dependents, backup policy, blockers. Changes nothing. |
| `module:uninstall {module}` | Back up per policy, delete its data, then `composer remove` its package. `--cascade` also uninstalls modules that require it, `--no-backup` skips an optional backup, `--keep-code` leaves the package, `--remove-code` deletes a project module's folder (not in production), `--force` skips typing the name. |
| `module:restore {module}` | Bring an uninstalled module back from a backup — the newest, or `--backup=<path\|timestamp>`. |
| `module:backups {module}` | List a module's backups. `--create` backs it up now, `--prune` deletes backups past the retention. |

## Copies of Atrium files

| Command | |
|---|---|
| `atrium:override {view}` | Copy one Atrium view into the project to edit it, e.g. `atrium:override atrium::layouts.backoffice` |
| `atrium:overrides` | List your copies and their state (up to date, customised, outdated, changed upstream). `--accept=<path>` after merging a changed one. |
| `vendor:publish --tag=atrium-config` | Copy Atrium's config files |
| `vendor:publish --tag=atrium-views` | Copy all layouts, components and error pages |
| `vendor:publish --tag=atrium-stubs` | Copy the `make:*` templates |
| `vendor:publish --tag=atrium-assets` | Copy the portal CSS/JS and logo (a new project already has them) |

See [Customising without forking](/guide/customising).

## Generators

| Command | |
|---|---|
| `make:subdomain {name}` | A portal of your own — see [make:subdomain](/guide/make-subdomain-command) |
| `make:module {name}` | A module inside the project, in `app/Modules` |
| `atrium:make-package {vendor/name}` | A module as its own Composer package — see [Build (and sell) a module](/guide/build-a-module) |
| `make:flag {name}` | A feature flag class (per portal; `--user` for per user) |

## Operations

| Command | |
|---|---|
| `health:check` | Run the health checks (as on Backoffice → System health) — [Health module](/packages/health) |
| `atrium:license {module?} {key?}` | Without arguments: every licensed module and its status. With a module: set its key; `--check` asks the licence server again, `--forget` removes the key |
