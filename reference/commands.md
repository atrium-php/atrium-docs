# Commands

## Install and upgrade

| Command | |
|---|---|
| `atrium:install` | First-run setup: module switches, app key, migrations, roles and the Super Admin, module defaults. Safe to re-run. `--modules=a,b` or `--pick` to choose modules, `--demo` for demo accounts (never in production), `--fresh` to start over, `--force` for production. Alias: `app:setup`. |
| `atrium:upgrade` | After `composer update`: migrations, one-off upgrade steps, refresh of untouched copies, cache clear — see [Upgrading](/guide/upgrading). `--force` in deploy scripts. |
| `atrium:doctor` | Checks the project: versions, pending work, stale copies, module switches, the user model. Exits 1 when something is broken. |
| `about` | Laravel's `about`, with installed Atrium versions and modules. |

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
| `health:check` | Run the health checks (as on Backoffice → System health) |
| `atrium:license {module?} {key?}` | Without arguments: every licensed module and its status. With a module: set its key; `--check` asks the licence server again, `--forget` removes the key |
