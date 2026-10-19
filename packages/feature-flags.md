# Feature Flags

| | |
|---|---|
| Package | `atrium-php/feature-flags` — module `feature-flags`, on once installed |
| Namespace | `Atrium\FeatureFlags\` |
| Depends on | core, Laravel Pennant |
| Permissions | `feature-flags.manage` |
| Pages | Backoffice → Feature flags (`/feature-flags`) |
| Uninstall | deletes every stored flag value (policy **optional**: backed up first unless you untick it) |

The backoffice page for [feature flags](/packages/core#feature-flags). The flags themselves — classes in `app/Features`, `Flags::active()`, `@flag`, `make:flag` — are part of core and work with or without this module. The module adds the page to switch them while the app runs.

## Install

```bash
php artisan module:install feature-flags
```

Or Backoffice → Modules → *Available* → *Install*.

## Backoffice → Feature flags

Every flag class is listed, with:

- **Portal flag** — a switch per portal it applies to, *All on* / *All off*, *Reset*.
- **User flag** — *All on* / *All off* for every user already decided (with a count of how many have it on), *Reset*. Users seen for the first time later are still decided by the flag's `initial()` rule.

*Reset* forgets the stored values, so every portal or user is decided by the flag's rule again. Changes apply on the next request.

## Switched off vs uninstalled

Pennant stores each flag's answer per portal or user in the `features` table: the switches flipped on this page, and the first answer a flag's rule gave (including random rollouts like "on for 10% of users", so each user keeps theirs).

- **Switched off** (Modules page switch, or `MODULE_FEATURE_FLAGS=false`): only the page and the menu entry go. Nothing is deleted; flags keep answering from their stored values.
- **Uninstalled**: every stored value in `features` is deleted — backed up first unless you untick it, and back with a restore. Flags then start again from their rule; Pennant stores the new answers as before.

## Upgrading a project from an earlier alpha

Projects created before Feature Flags was a module don't have the package. Their flags keep working; to keep the page, add it, then upgrade:

```bash
composer require atrium-php/feature-flags
php artisan atrium:upgrade
```

A replaced page is now `feature-flags::index` (was `atrium::backoffice.feature-flags`).
