# Landing

The public entry point, on `APP_MAIN_DOMAIN` itself (no subdomain). No sign-in required.

| | |
|---|---|
| Page | `atrium::landing.index` at `/` |
| Layout | `atrium::layouts.landing` |
| CSS / JS | `resources/css/landing.css`, `resources/js/landing.js` (your copies) |

## What's on the page

A hero and a feature grid describing Atrium. Sign-in and create-account buttons show when those routes exist. It's a placeholder for your product's marketing page — replace it (see [Replacing a portal page](#replacing-a-portal-page)).

## Language switcher

In the header, `<x-language::locale-switcher />` — hidden until two languages are active. Landing follows the URL's language (`?lang=` or `/xx`, whichever [URL mode](/packages/language#url-mode) is on), even for signed-in visitors. See [Localization & RTL](/packages/language).

## Error and maintenance pages

Landing has its own error/maintenance design (`atrium::errors.landing.page`) instead of the shared one. See [Error Pages](/guide/error-pages).

## Replacing a portal page

Atrium's portal pages live in `vendor/atrium-php/core`. To change one, either swap the whole page for your own Livewire component (same URL, route name and middleware):

```php
// AppServiceProvider::register()
Platform::component('atrium::landing.index', \App\Livewire\Home::class);
```

or copy its layout or a view into the project with `php artisan atrium:override …`. See [Customising without forking](/guide/customising).
