# Upgrading

Atrium's packages (`atrium-php/core`, the modules, `atrium-php/skeleton`) are released together under one version number, following [Semantic Versioning](https://semver.org):

- **1.0.x**: fixes.
- **1.x.0**: new features, never breaking anything tagged `@api`. Anything due for removal is deprecated first.
- **x.0.0**: may break `@api`. Every change is listed in [UPGRADE.md](https://github.com/atrium-php/atrium/blob/main/UPGRADE.md).

Release notes and a public changelog start with 1.0.

## Every upgrade

```bash
composer update "atrium-php/*" --with-dependencies
php artisan atrium:upgrade
npm run build          # when atrium:upgrade says frontend files changed
php artisan atrium:doctor
```

`atrium:upgrade`:

1. Runs migrations (core and every installed module), and finishes the install of a module package you added with `composer require`: its data is seeded and Super Admin and Admin get its permissions.
2. Runs the release's one-off **upgrade steps**, each once, in version order, recorded in `platform_upgrades`. A step that fails stops the run and stays pending for next time.
3. Refreshes your **untouched copies** of Atrium files (see [Customising](./customising#your-copies-of-atrium-files)) and lists the ones you customised whose originals changed.
4. Clears caches.

It asks before running in production; pass `--force` in deploy scripts.

## Checking a project

`php artisan atrium:doctor` checks:

- PHP and Laravel versions
- pending migrations and upgrade steps
- out-of-date copies
- module switches in `config/modules.php` that nothing provides
- whether `App\Models\User` has what each enabled module needs (the Api module needs Sanctum's `HasApiTokens`; Media needs `HasMedia`)
- edits inside source-installed Atrium packages

It exits 1 when something is broken, so it fits in CI. `php artisan about` shows the installed Atrium versions.

## Shipping an upgrade step (module authors)

```php
class MoveTrialDates implements \Atrium\Core\Contracts\UpgradeStep
{
    public function key(): string { return 'acme/invoices:1.3.0:move-trial-dates'; } // never change once released
    public function version(): string { return '1.3.0'; }
    public function description(): string { return 'Move trial dates to the subscriptions table'; }
    public function run(): void { /* must also be safe on a fresh install */ }
}
```

Return it from your provider's `upgradeSteps()`.
