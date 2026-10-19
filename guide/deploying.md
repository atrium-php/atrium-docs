# Deploying

An Atrium project deploys like any Laravel app — [Laravel's deployment guide](https://laravel.com/docs/deployment) applies. This page covers what Atrium adds.

## Every deploy

```bash
composer install --no-dev --optimize-autoloader
php artisan atrium:upgrade --force      # migrations, upgrade steps, cache clear
npm ci && npm run build
php artisan optimize
php artisan queue:restart
```

`atrium:upgrade` asks before running in production; `--force` is for deploy scripts. Run `php artisan atrium:doctor` afterwards — it exits 1 when something is wrong, so it can fail the deploy.

The server needs your [Flux Pro credentials](/reference/flux-ui) for `composer install` (an `auth.json` next to `composer.json`, or `COMPOSER_AUTH`).

## Domains

Point the main domain and every portal subdomain (`auth.`, `account.`, `app.`, `backoffice.`, and `api.` with the API module) at `public/`, with a certificate that covers them (a wildcard is simplest). Set `APP_URL`, `APP_MAIN_DOMAIN` and `SESSION_DOMAIN=.yourdomain.com`. On one domain instead: `APP_SINGLE_DOMAIN=true`.

## Queue worker and scheduler

Both are required.

- **Queue worker** (Supervisor, systemd, Forge, Cloud…): `php artisan queue:work`. Module installs, uninstalls, restores and backups, account data exports and deletions, and notification mail run on it. Use a real queue connection (`database`, `redis`), never `sync`.
- **Scheduler**: `* * * * * php /path/to/app/artisan schedule:run` in cron. Health notifications, pending account deletions and module jobs (exchange rates, backups, …) depend on it. The [Health module](/packages/health) warns when its heartbeat is missing.

## Modules on a server

Installing or uninstalling a module from Backoffice → Modules runs **Composer on the server**, from the queue worker. For that to work:

| Need | Why |
|---|---|
| Composer installed and runnable by the queue worker's user | `MODULE_COMPOSER` (default `composer`) — a full path or `php /path/composer.phar` works too |
| That user can write `vendor/`, `composer.json`, `composer.lock` and `bootstrap/cache/` | Composer rewrites them |
| A Composer home it can write | `COMPOSER_HOME`; defaults to `storage/framework/composer` |
| Flux Pro and any private repository credentials visible to it | Composer resolves the whole project again |
| `APP_MAINTENANCE_DRIVER=file` (the default) on a single server | While Composer rewrites `vendor/`, the app is put in maintenance mode with a page that reloads by itself (`MODULE_MAINTENANCE_WINDOW`) |

The change happens only **on the machine the worker runs on**, and only in its copy of `composer.json` and `composer.lock`:

- **Deployed from git?** Make the same change in your repository — `composer require atrium-php/<module>` or `composer remove atrium-php/<module>` — and deploy it. Otherwise the next deploy brings back the old package list: a removed module's code comes back (its data stays uninstalled; the Modules page offers *Remove code*), and an installed one's code goes away.
- **Several servers**, or an image-based / read-only deploy? Don't let the app change code at all. Set `MODULE_REMOVE_CODE=false` and add modules to `composer.json` in your repository; uninstalling from the Modules page then removes only the data, and you remove the package with your next deploy.

A typical git-based flow: try the module on staging from the Modules page, then commit the `composer.json` / `composer.lock` change and deploy it to production, then *Install* on production's Modules page sets up the data.

## Health checks

- `GET /up` — liveness, for the load balancer. Every project has it.
- `GET /health` — readiness, with the [Health module](/packages/health): 200 when ok or warning, 503 when something failed. Send `X-Health-Token: <HEALTH_TOKEN>` for each check's detail. Point an uptime monitor at it.
- `HEALTH_NOTIFY_MAIL=ops@example.com` — an email when the overall status changes (Health module).

See [Health](/packages/health).

## Keep `.env` safe

`APP_KEY` decrypts 2FA secrets, encrypted settings, and module backups whose password is derived from it. Keep `.env` in your secrets manager, not only on the server — a restored database is unreadable without it.

## Backups

Turn on full-site backups with the [Backup module](/packages/backup) (`BACKUP_ENABLED=true`, an off-site disk). Module backups taken before an uninstall go to `MODULE_BACKUPS_DISK` — set it to an off-site disk too.
