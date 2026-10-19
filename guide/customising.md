# Customising without forking

An Atrium project never edits files under `vendor/atrium-php/`. That's what keeps `composer update` safe. You change Atrium through the extension points below instead. They are tagged `@api`: within a major version (1.x) they don't break.

## Where to change what

| To change | Do |
|---|---|
| A setting or a feature switch | `.env`, `config/*.php`, Backoffice → Settings, Backoffice → Modules |
| The user model (columns, relations, traits) | Edit `App\Models\User`. It extends `Atrium\Core\Models\User` and is registered with `Platform::useUserModel()` in `AppServiceProvider`. |
| A page | `Platform::component('atrium::backoffice.users', App\Livewire\Users::class)`. Same URL, route name and middleware. |
| Middleware around Atrium's routes | `Platform::routeMiddleware(MyMiddleware::class)` for every portal, or `…, 'backoffice')` for one |
| A layout, component or error page | `php artisan atrium:override atrium::layouts.backoffice` (one view), or `php artisan vendor:publish --tag=atrium-views` |
| Atrium's own config | `vendor:publish --tag=atrium-config`, or create `config/multidomain.php` etc. A project file wins. |
| `make:*` generator templates | `vendor:publish --tag=atrium-stubs` |
| Portal CSS/JS, the logo | The copies in `resources/css`, `resources/js`, `resources/assets` (a new project starts with them) |
| A service: SMS, currencies, languages | Bind the contract (`Atrium\Core\Contracts\SmsService`, …) in a project service provider |
| Brand name, logo, favicon, colour, the "Powered by Atrium" credit | Backoffice → Settings |
| Something new | A project module: `php artisan make:module Invoices`, in `app/Modules` |
| React to Atrium | Its events: `AccountDeleting`, `UserAnonymized`, `Audited` |

Call `Platform::` methods from a service provider's `register()`:

```php
// app/Providers/AppServiceProvider.php
public function register(): void
{
    Platform::useUserModel(User::class);
    Platform::component('atrium::backoffice.users', \App\Livewire\Users::class);
    Platform::routeMiddleware(\App\Http\Middleware\AuditTrail::class, 'backoffice');
}
```

## Your copies of Atrium files

Every copy you make (with `atrium:override` or `vendor:publish --tag=atrium-*`) and every copy the skeleton ships is recorded in `atrium-overrides.json`. Commit that file. Each entry remembers which Atrium file the copy came from and what the original looked like.

`php artisan atrium:overrides` lists the copies:

| State | Meaning | What happens |
|---|---|---|
| up to date | Nobody changed anything | — |
| customised | You edited it; Atrium didn't | Left alone |
| outdated | Atrium changed it; you never edited your copy | `atrium:upgrade` refreshes it |
| changed upstream | Both changed it | Merge by hand, then `atrium:overrides --accept=<path>` |

## Public API

Classes tagged `@api` are what projects (and modules) build on: `Platform`, `ModuleProvider`, the `Module` facade, the contracts, events, `Audit`/`Auditable`, `Brand`, the licensing classes, `Models\User`, `Role`, `Permission`, `AppSetting` and others. Everything tagged `@internal` may change in any release. Atrium's own tests check that the skeleton — the code a project starts with — only uses `@api` classes; keep your project to them too.
