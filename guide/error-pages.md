# Error Pages

Every portal renders branded 401/403/404/412/419/429/500/503 pages instead of Laravel's stock ones. Which design a portal uses is set by `config('multidomain.page_style')`.

## The style per portal

Atrium's defaults:

```php
'page_style' => [
    'auth' => 'shared',
    'app' => 'shared',
    'backoffice' => 'shared',
    'account' => 'shared',
    'landing' => 'landing',
],
```

| Value | Meaning |
|---|---|
| `'shared'` | The common design |
| `'own'` | The portal's own page — `resources/views/errors/{portal}/page.blade.php` |
| `'<portal>'` | Reuse another portal's design, e.g. `'landing'` |

A portal not listed uses `'shared'`. To change the list, publish the portal config (`php artisan vendor:publish --tag=atrium-config`) and edit `page_style` in `config/multidomain.php`.

## How a page is chosen

Atrium catches every HTTP exception before Laravel's own error views and renders one dispatcher view. It works out the current portal (from the host, or from the first path segment in [single-domain mode](/guide/single-vs-multi-domain)), looks up its style, and renders the first page that exists:

1. `resources/views/errors/{set}/page.blade.php` in your project;
2. Atrium's `atrium::errors.{set}.page`;
3. the shared page — so a portal whose own page doesn't exist yet never 500s.

JSON requests are left alone and get Laravel's normal JSON error body. The [maintenance page](/packages/maintenance) goes through the same dispatcher as the pseudo code `"maintenance"`.

## Changing the design

- **Shared design** (auth, app, account, backoffice) — copy it into the project and edit the copy:
  ```bash
  php artisan atrium:override atrium::errors.shared.page
  # → resources/views/vendor/atrium/errors/shared/page.blade.php
  ```
- **Landing** — the same with `atrium::errors.landing.page`.
- **A portal with the `own` style** — edit `resources/views/errors/{portal}/page.blade.php`, which [`make:subdomain`](/guide/make-subdomain-command) scaffolds.

Copies made with `atrium:override` are tracked in `atrium-overrides.json`; `atrium:overrides` tells you when Atrium's original changes (see [Customising](/guide/customising#your-copies-of-atrium-files)).

Each page receives `$code`, `$meta` (`title` and `description` for the code) and an optional `$message`, so a copied page can change the wording too.

## Assets

The error pages have their own Vite entry, `resources/css/errors.css` / `resources/js/errors.js`, importing the same `theme.css` and edge design as every portal (see [Theming](/guide/theming)).
