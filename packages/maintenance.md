# Maintenance

| | |
|---|---|
| Package | `atrium-php/maintenance` — module `maintenance`, on by default (`MODULE_MAINTENANCE`) |
| Namespace | `Atrium\Maintenance\` |
| Depends on | core |
| Permissions | `maintenance.view`, `maintenance.update` |
| Pages | Backoffice → Maintenance (`/maintenance`) |
| Config | `maintenance` — `APP_MAINTENANCE`, `exempt_portals` |

Two independent switches, both showing the same branded maintenance page (rendered like the [error pages](/guide/error-pages), with `"maintenance"` as the pseudo status code):

1. **Global** — `APP_MAINTENANCE=true`. Every portal, backoffice included, shows the maintenance page. No CLI access needed: change the env var and deploy.
2. **Per portal** — Backoffice → Maintenance. Staff take a single portal (landing, app, or one of your own) down without touching the others.

Four portals never appear in the per-portal list:

- **`backoffice`** — staff always need a way in to switch things back.
- **`account`** and **`auth`** — they serve the other portals; taking one down alone would strand users mid-sign-in.
- **`api`** — not a UI portal; there's no page to show.

The global switch overrides every exemption.

```
                    APP_MAINTENANCE=true?
                            │
                 ┌──────────┴──────────┐
                yes                    no
                 │                      │
       every portal down        portal exempt?
                                (backoffice, account,
                                 auth, api)
                                        │
                             ┌──────────┴──────────┐
                            yes                     no
                             │                       │
                       passes through        per-portal switch on?
                                                      │
                                           ┌──────────┴──────────┐
                                          yes                    no
                                           │                      │
                                  maintenance page          passes through
```

## How it's enforced

The module appends its middleware to the `web` group, so every portal — including ones you add with `make:subdomain` — is covered with no route edits. With the module switched off, neither switch applies.

## Configuration

Atrium's defaults:

```php
'global' => (bool) env('APP_MAINTENANCE', false),
'exempt_portals' => ['backoffice', 'account', 'auth', 'api'],
```

To change the exempt list, create `config/maintenance.php` in your project with the keys you want to change — a project file wins over the module's.

## Per-portal switch (Backoffice → Maintenance)

One row per portal in `config('multidomain.sub_domains')` minus the exempt ones, each with a switch and an optional message shown on that portal's maintenance page instead of the default text. Permissions: `maintenance.view`, `maintenance.update`.

Settings are cached for 5 minutes per portal and the cache is cleared on save, so a change takes effect on the next request. When `APP_MAINTENANCE` is on, the page shows a banner explaining that it overrides every switch.

## Laravel's own maintenance mode

`php artisan down` / `up` work exactly as in any Laravel app — a separate, CLI-only switch for the whole application. Use the switches on this page for per-portal or env-driven maintenance.
