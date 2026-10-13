# Skeleton

| | |
|---|---|
| Package | `atrium-php/skeleton` (type `project`) |
| Use | `composer create-project atrium-php/skeleton my-app` — see [Getting Started](/guide/getting-started) |
| Requires | `atrium-php/core` and all eight modules, `livewire/flux-pro` ([Flux UI Pro](/reference/flux-ui)) |

The skeleton is a thin Laravel app. After `create-project` it's **your project** — Atrium itself stays in `vendor/atrium-php/*` and upgrades with `composer update` + `php artisan atrium:upgrade`.

## What's in it

```
app/
├── Models/User.php         extends Atrium\Core\Models\User; has what the API and Media modules need
├── Providers/              your service providers — Platform::useUserModel(), overrides, bindings
├── Features/               feature flag classes (two examples)
└── Modules/                your own modules (php artisan make:module)
config/
├── modules.php             MODULE_* switches for every module
└── …                       Laravel's config (Atrium's own config ships in its packages)
resources/
├── css/, js/               each portal's Vite entry + theme.css and the edge design — copies, yours to edit
├── assets/                 the logo
└── views/                  your views; copies of Atrium views go in views/vendor/atrium
routes/web.php              your routes — Atrium registers its portals itself
atrium-overrides.json       every copy of an Atrium file and where it came from — commit it
tests/                      a small suite: the portals answer, your user model is in use
.env.example                SQLite, yourapp.test, modules, Atrium's env vars
```

## Composer scripts

| | |
|---|---|
| `composer setup` | `install`, `.env`, app key, `atrium:install --force`, `npm install`, `npm run build` — a fresh clone in one step |
| `composer dev` | server, queue worker and Vite together |
| `composer test` | the test suite |
| `composer analyse` | PHPStan (Larastan) |

## Upgrading the skeleton itself

Files that came from the skeleton are yours and never change under you. When Atrium changes one of the copies it gave you (portal CSS/JS, logo), `atrium:upgrade` refreshes your copy if you never edited it, and `atrium:overrides` lists the ones you edited — see [Customising](/guide/customising#your-copies-of-atrium-files). Anything else that changes in new skeletons is listed in [UPGRADE.md](https://github.com/atrium-php/atrium/blob/main/UPGRADE.md).
