# Build (and sell) a module

Atrium and its modules are free (MIT). Anyone can write modules for it, give them away, or sell them to their clients. Atrium provides the tooling and never charges or enforces anything itself.

## Create one

```bash
php artisan atrium:make-package acme/invoices
```

This creates `packages/acme/invoices`, a Composer package of type `atrium-module`:

```
composer.json                       type atrium-module; requires the atrium-php/core you run; extra.atrium
src/InvoicesServiceProvider.php     extends ModuleProvider
routes/backoffice.php               its pages, inside Atrium's backoffice
resources/views/livewire/⚡index     a first page
database/migrations/
tests/TestCase.php, tests/Pest.php, tests/Feature/InvoicesTest.php   its test suite (below)
phpunit.xml.dist, .github/workflows/tests.yml, README.md
```

To develop it inside a project:

```bash
composer config repositories.invoices path packages/acme/invoices
composer require acme/invoices:@dev
php artisan atrium:upgrade
```

It appears on Backoffice → Modules. Atrium finds modules through `"type": "atrium-module"` and `extra.atrium.provider`, the same way it finds its own. No vendor gets special treatment.

## The module contract

Your provider extends `Atrium\Core\Support\Modules\ModuleProvider`:

| Method | For |
|---|---|
| `module()`, `label()`, `description()`, `icon()` | Identity on the Modules page |
| `permissions()`, `superAdminOnlyPermissions()` | Spatie permissions, seeded even while the module is off |
| `bootModule()`, `registerModule()`, `schedule()` | Only run while the module is on |
| `Module::contribute(...)` | Nav links, settings groups and fields ([Settings](/portals/backoffice#from-your-own-module)), health checks, header actions (`shell.header.actions`), dashboard cards ([`dashboard.widgets`](/packages/analytics#dashboard-widgets)), items under the sidebar brand ([`shell.sidebar.header`](/packages/teams#for-module-authors)), banners above every page (`shell.banners`) and on the landing page ([`landing.banners`](/packages/announcements#for-module-authors)), properties on every audit entry (`audit.context`), actions refused while support views as someone ([`impersonation.blocked`](/packages/impersonation#blocking-your-own-actions)), notification types and channels ([Notifications](/packages/notifications#sending-your-own-notifications)), outgoing webhook events ([`webhooks.events`](/packages/webhooks#sending-your-own-events)), new-password rules and Account → Security sections ([`password.rules`, `account.security.cards`](/packages/security#for-module-authors)), … |
| `seeders()`, `upgradeSteps()` | Data on install, one-off upgrade steps |
| `userNeeds()` | Traits/interfaces `App\Models\User` must have (checked by `atrium:doctor`) |
| `licenseGate()`, `whenUnlicensed()` | Licensing (below) |

## Sidebar links

The app, backoffice and account portals share one shell: a sidebar that collapses to icons on desktop and becomes a drawer on mobile. Add your pages to it from `bootModule()`:

```php
Module::contribute('backoffice.nav', [
    [
        'label' => 'Invoices',                    // translated for you
        'route' => 'backoffice.invoices.index',
        'icon' => 'document-text',                // a Flux (Heroicons) name
        'permission' => 'invoices.view',          // or a list: any of them
        'order' => 40,
        'group' => 'Billing',                     // a heading; leave out for "System"
        'active' => 'backoffice.invoices.*',      // routes that mark it current
    ],
    [
        'label' => 'Reports', 'icon' => 'chart-pie', 'children' => [   // an expandable sub-list
            ['label' => 'Monthly', 'route' => 'backoffice.reports.monthly'],
            ['label' => 'Yearly', 'route' => 'backoffice.reports.yearly'],
        ],
    ],
]);
```

The same keys work for `account.nav` and `app.nav`, plus `'visible' => fn (?User $user) => bool` for anything a permission can't express. Any item can carry `'badge' => fn (?User $user) => ...` — a count or short text next to the label; `null`, `''` or `0` shows none. A link whose route doesn't exist, or that the user may not see, is left out; so is a parent with no visible child. In the backoffice, items without a `group` go under *System*; `'group' => null` puts one above every heading.

## Uninstall, backup and restore

Projects can uninstall your module from Backoffice → Modules, which backs its data up, deletes it, and removes the package — and later restore it from that backup ([Modules](/guide/modules)). Atrium does the work; your provider declares what the module owns:

```php
use Atrium\Core\Support\Modules\BackupPolicy;
use Atrium\Core\Support\Modules\OwnedData;

protected function ownedData(): OwnedData
{
    return new OwnedData(
        tables: ['invoices', 'invoice_lines'],          // every table your migrations create
        settings: ['invoices.prefix'],                  // app_settings keys you write
        morphTypes: [Invoice::class],                   // rows elsewhere pointing at these go too
        features: ['invoice-reminders'],               // Pennant flags you define
        storage: ['local' => ['invoices']],             // folders you own, per disk
        files: ['invoices' => ['disk', 'pdf_path']],    // files tracked in your rows
        searchable: [Invoice::class],                   // Scout models: index emptied / rebuilt
    );
}

protected function backupPolicy(): BackupPolicy
{
    // none(): nothing worth keeping · optional(): offered, the default · required(): always
    return BackupPolicy::required(files: true, excludeTables: ['invoice_webhook_log'], neverRestore: []);
}

protected function uninstallBlockers(): array
{
    return [UnpaidInvoices::class];   // implements Atrium\Core\Contracts\UninstallBlocker
}

protected function afterRestore(): void
{
    // Rebuild derived data (caches, thumbnails) once the rows and files are back.
}
```

- An `UninstallBlocker`'s `check(): ?string` returns why the module can't go right now, or `null`. It's shown in the impact report and checked again just before the uninstall.
- Restores import your rows with their original ids, then run any migrations newer than the backup — write migrations that work on existing data, as for any upgrade.
- Tables in `neverRestore` are backed up but stay empty after a restore (tokens, secrets).
- `"required": true` under `extra.atrium` makes a module impossible to uninstall.

## On the Modules page before it's installed

Atrium's own modules appear under *Available* even in projects that don't have them. Yours can too: the project lists it in `config/module-lifecycle.php`, and *Install* runs `composer require` for it:

```php
'catalog' => [
    ['module' => 'invoices', 'package' => 'acme/invoices', 'label' => 'Invoices',
     'description' => 'Invoices and payments.', 'icon' => 'document-text'],
],
```

The package must be installable from that project (Packagist, or a repository in its `composer.json`).

## Testing

Atrium tests its own modules with `Atrium\Core\Testing\TestCase` (`@api`), an [Orchestra Testbench](https://packages.tools/testbench) test case that boots core plus the modules a suite names, configured like a new project:

```php
abstract class TestCase extends \Atrium\Core\Testing\TestCase
{
    protected ?array $modules = ['invoices'];

    // When your userNeeds() asks for a trait: a test user model that has it.
    protected function userModel(): string
    {
        return Fixtures\User::class;   // extends Atrium\Core\Testing\User
    }
}
```

`atrium:make-package` sets this up: run `composer install`, then `composer test` in the package. The scaffolded `tests/Feature/InvoicesTest.php` checks the module is found, seeds its permissions, registers its page, and registers nothing while switched off; add your tests next to it. The same suite runs in the package's GitHub workflow.

Helpers: `disableModules()`, `enableModules()`, `rebootApplication()`, and from `Platform::path('testing/helpers.php')` (loaded by the scaffold's `tests/Pest.php`) `superAdminActor()`, `adminActor()`, `staffUser()`, `backofficeUrl()`. `User::factory()->staff()` makes a user who may enter the backoffice.

Atrium's pages render Flux components, so a test that renders a page needs Flux Pro in the package too: add `livewire/flux-pro` to `require-dev` and your Flux credentials (in CI, as secrets). Tests that don't render — models, services, jobs, permissions, routes — need nothing extra.

## Versions and the public API

`atrium:make-package` sets the `atrium-php/core` range to the version the project runs (`^1.2`, or `^1.0@alpha` on a pre-release). Keep it at the range you test against, so Composer refuses an Atrium upgrade your module doesn't support yet. If the project installs Atrium from a private repository (internal pre-releases), the package gets that repository entry too, so its own `composer install` and CI work; its workflow reads it with an `ATRIUM_GITHUB_TOKEN` secret. Depend on Atrium through Composer and use only its `@api` classes. Never copy Atrium code into your package.

## Selling it

**Distribution:** serve the package from a private Composer repository (Private Packagist, Satis, Anystack, GitHub Packages). Each client adds the repository and an `auth.json`, the same way they install Flux Pro.

**Licensing (optional):** plug in your own licence check. Atrium stores the client's key encrypted, caches the answer for 12 hours, shows the status and your renewal link on the Modules page, and never contacts anyone itself.

```php
protected function licenseGate(): ?string
{
    return InvoicesLicense::class;
}

// Optional: Atrium's standard response while the licence isn't usable.
protected function whenUnlicensed(): ?LicenseRestriction
{
    return LicenseRestriction::readOnly(allow: ['invoices.view', 'invoices.export']);
}
```

```php
class InvoicesLicense implements \Atrium\Core\Contracts\LicenseGate
{
    public function check(string $key): LicenseStatus
    {
        $answer = Http::post('https://licences.acme.test/check', ['key' => $key])->json();

        return match ($answer['status']) {
            'active' => LicenseStatus::valid(expiresAt: Carbon::parse($answer['expires'])),
            'grace' => LicenseStatus::grace('Renew within 7 days.', renewUrl: $answer['renew_url']),
            'expired' => LicenseStatus::expired('Your licence expired.', renewUrl: $answer['renew_url']),
            default => LicenseStatus::invalid('This key is not valid.'),
        };
    }
}
```

- **`LicenseRestriction::readOnly(allow: [...])`:** while the licence is expired, invalid or missing, the module's other permissions are denied for everyone, Super Admin included. Enforcement goes through the Gate, so `@can`, `authorize()`, `can:` middleware and policies all follow. A grace period still counts as licensed unless you add `->strictDuringGrace()`. `::lockout()` denies everything; `->protect([...])` also covers abilities that aren't permissions.
- **No restriction (`null`):** you decide. Read `app(Licenses::class)->status('invoices')` and apply your own policy, such as a grace period, limits or a lockout.
- **`licensed:invoices`** middleware locks whole routes. `<x-atrium::license-badge module="invoices" />` shows the badge and renewal link anywhere.
- If your licence server can't be reached, Atrium keeps the last answer, or treats it as a grace period when there is none. It never locks a client out because of an outage.

Clients can also manage keys with `php artisan atrium:license invoices <key>`, `--check` and `--forget`.

**Flux Pro:** Atrium's UI uses Flux Pro, which is licensed per project. Your clients need their own Flux Pro licence too.
