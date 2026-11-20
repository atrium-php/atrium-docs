# Troubleshooting & FAQ

### The Modules page says "Background jobs are waiting"

Nothing processes the queue. Installs, uninstalls, restores and backups wait until a worker picks them up. Locally run `composer dev` (it includes a worker) or `php artisan queue:work`; on a server, run a worker under Supervisor or similar — see [Deploying](/guide/deploying#queue-worker-and-scheduler).

### The site says "Adding …" / "Removing …" / "Updating …"

Composer is changing `vendor/`; the page goes back to the app by itself when it's done (seconds to a minute). If it stays, the Composer run was interrupted: check `storage/logs/laravel.log`, finish or undo the change (`composer install`), then `php artisan up`.

### Installing a module fails with a Composer error

The queue worker runs Composer, so it needs what you need on the command line: Composer on its `PATH` (or `MODULE_COMPOSER`), write access to `vendor/`, `composer.json`, `composer.lock`, and the Flux Pro / private repository credentials. The error from Composer is on the Modules page under *Recent activity* and in the log.

`The 'https://composer.fluxui.dev/packages.json' URL required authentication (HTTP 401)` means the worker can't see your Flux Pro licence. It runs Composer with its own home (`COMPOSER_HOME`, default `storage/framework/composer`), so credentials saved with `composer config --global` on your user account don't reach it. Put an `auth.json` next to the project's `composer.json` (git-ignored: `composer config http-basic.composer.fluxui.dev "<licence-email>" "<licence-key>"` in the project), or set `COMPOSER_AUTH` / `COMPOSER_HOME` for the worker, then restart it.

### I uninstalled a module but its code came back after a deploy

Your server is deployed from git, and the repository's `composer.json` still requires the package. Run `composer remove atrium-php/<module>` in the repository and deploy, or press *Remove code* on the Modules page. Its data stays uninstalled either way. See [Modules](/guide/modules#uninstall).

### Uninstall is refused

The impact report lists why: a **blocker** (Billing while subscriptions are active), a module that **requires** it (uninstall that one too, or tick *cascade*), or a **required** module, which can never be uninstalled. A failed **backup** also stops a module whose policy requires one — the module is left off but installed; fix the disk, then try again.

### A module's code won't be removed

Your user model still uses the module's trait (`HasApiTokens` for API, `HasMedia` for Media) — the app wouldn't boot without it. Remove it from `App\Models\User` (and any other model), then *Remove code*.

### A restore is refused

The backup comes from a newer release than the module's code here — update first (`composer update`, `atrium:upgrade`). Or it can't be decrypted: module backups need the same `MODULE_BACKUPS_PASSWORD` / `BACKUP_ARCHIVE_PASSWORD`, or the same `APP_KEY` when neither was set.

### `MODULE_MEDIA=false` in `.env` does nothing

`MODULE_*` variables are read by `config/modules.php`, which starts empty. Add `'media' => (bool) env('MODULE_MEDIA', true),` there, or use the switch on Backoffice → Modules.

### `atrium:doctor` says my user model is missing something

An enabled module needs a trait or interface on `App\Models\User` — add exactly what it names. See [Packages](/packages/#what-a-module-may-ask-of-your-user-model).

### I'm signed out when I move between portals

`SESSION_DOMAIN` must be `.yourdomain` (with the leading dot) and match `APP_MAIN_DOMAIN`. See [Cross-Subdomain SSO](/guide/sso-sessions).

### A portal subdomain shows the wrong page or 404

Every subdomain must point at `public/`, and `APP_MAIN_DOMAIN` must be the domain you browse. After changing `.env`, run `php artisan config:clear` (or `optimize` again on a server).
