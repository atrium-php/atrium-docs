# App

Your application's signed-in area, on `app.APP_MAIN_DOMAIN` (`/app` in [single-domain mode](/guide/single-vs-multi-domain)).

| | |
|---|---|
| Page | `atrium::app.dashboard` at `/` (route `app.dashboard`) |
| Layout | `atrium::layouts.app` |
| CSS / JS | `resources/css/app.css`, `resources/js/app.js` (your copies) |

## Dashboard

**Placeholder content**, not real data: stat cards, a 7-day chart and a recent-activity feed standing in for whatever your product does. Replace it with your own Livewire component:

```php
// AppServiceProvider::register()
Platform::component('atrium::app.dashboard', \App\Livewire\Dashboard::class);
```

Add your other pages as ordinary routes in `routes/web.php`, inside the app portal's domain:

```php
Route::domain(config('multidomain.sub_domains.app'))->name('app.')
    ->middleware(['auth', 'phone.verified', 'email.grace', 'portal:user'])
    ->group(function () {
        Route::livewire('projects', \App\Livewire\Projects::class)->name('projects');
    });
```

Put them in the sidebar from a service provider's `boot()` (the same extension point modules use):

```php
use Atrium\Core\Support\Modules\Module;

Module::contribute('app.nav', [
    ['label' => 'Projects', 'route' => 'app.projects', 'icon' => 'folder', 'order' => 10],
]);
```

See [Build a module → Sidebar links](/guide/build-a-module#sidebar-links) for every key.

In [single-domain mode](/guide/single-vs-multi-domain) add `->prefix('app')` (when `config('multidomain.single_domain')` is true) so your URLs sit next to Atrium's under `/app`.

## Access

Atrium wraps the portal in `['auth', 'phone.verified', 'email.grace', 'portal:user']`. `portal:user` sends staff to the backoffice, keeping end users and staff in their own portals (see [Roles & Permissions](/guide/roles-and-permissions#gate-bypass)). `phone.verified` and `email.grace` belong to the [verification flow](/portals/auth): the first passes straight through while phone verification is off, the second blocks only once a user's email-verification grace period has run out.

To add middleware to every app route Atrium registers: `Platform::routeMiddleware(MyMiddleware::class, 'app')`.
