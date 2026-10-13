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
tests/ManifestTest.php, phpunit.xml.dist, .github/workflows/tests.yml, README.md
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
| `Module::contribute(...)` | Nav links, settings fields, health checks, … |
| `seeders()`, `upgradeSteps()` | Data on install, one-off upgrade steps |
| `userNeeds()` | Traits/interfaces `App\Models\User` must have (checked by `atrium:doctor`) |
| `licenseGate()`, `whenUnlicensed()` | Licensing (below) |

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
