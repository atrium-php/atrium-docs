# Analytics

| | |
|---|---|
| Package | `atrium-php/analytics` — module `analytics`, on once installed |
| Namespace | `Atrium\Analytics\` |
| Depends on | core |
| Permissions | `analytics.view` (Admin has it; give it to any role) |
| Pages | a *Last 30 days* row on the Backoffice dashboard; Backoffice → **Analytics** |
| Commands | `analytics:aggregate` (nightly), `analytics:backfill` |
| Config | `analytics` (below) |
| Uninstall | backup **optional**; tables `analytics_daily_metrics`, `analytics_user_days` |

How the app is doing, from its own data — no tracking script, nothing sent anywhere:

- **Signups** — new accounts;
- **Active users** — people who signed in or used the app, each counted once per period;
- **Logins** — sign-ins (support [viewing as someone](/packages/impersonation) doesn't count);
- **Verified** — share of all users with a verified email;
- **Two-factor** — share of all users with two-factor authentication on.

**With the module off or uninstalled nothing breaks.** The dashboard shows core's own counts and newest users, as before.

## Install

```bash
php artisan module:install analytics
```

Or Backoffice → Modules → *Available* → *Install*. Nothing to add to your user model. Make sure the [scheduler](/guide/deploying) runs — it stores yesterday's numbers every night (a missed night is filled in the next time the page needs it).

## Dashboard and Analytics page

The **dashboard** gets a *Last 30 days* row: signups, active users, logins and the verified share, each with its change against the 30 days before, and **View details**.

Backoffice → **Analytics**:

- **Range**: today, last 7 / 30 / 90 days, last 12 months (by month), or custom dates (by month past 92 days).
- **Compare with** the period right before, the same dates last year, or nothing. Counts show the change in %, shares in percentage points.
- **KPI cards** for all five numbers — click one to chart it.
- **Chart**: line or area, the compared period dashed, a tooltip per day (or month).
- **Export**: every number per day (or month) of the range as CSV, with the compared period's columns when comparing.

Range, comparison, metric and chart type are in the URL, so a view can be bookmarked or shared.

## What it records

Two things can't be worked out later, so the module records them as they happen:

- every **sign-in** (Laravel's `Login` event) adds one to the day's logins;
- the first request of the day of a signed-in user marks them **active** that day — one row per user per day (`analytics_user_days`), no IP address, no user agent.

Everything else comes from the users table (`created_at`, `email_verified_at`, `two_factor_confirmed_at`). `analytics:aggregate` stores each day's numbers in `analytics_daily_metrics` at 00:20, so the page never scans the users table for a past day; today is worked out live.

**History**: signups and the shares go back as far as your users do; logins and active users start the day the module is installed. After importing users, run `php artisan analytics:backfill --days=365` to redo past days.

Active days are kept for 400 days (enough for the 12-month range), then pruned by the nightly run.

## Configuration

`config('analytics')`, from the package's `config.php`:

| Key | `.env` | Default | |
|---|---|---|---|
| `keep_days` | `ANALYTICS_KEEP_DAYS` | `400` | How long active days are kept (`0` keeps them) |

## Commands

| Command | |
|---|---|
| `analytics:aggregate [--date=Y-m-d]` | Store a day's numbers (yesterday by default) and prune old active days. Scheduled daily at 00:20 |
| `analytics:backfill [--days=365]` | Redo past days from the users table, e.g. after an import |

## Dashboard widgets

The dashboard is a grid of widgets modules contribute (`dashboard.widgets`, core). Besides Analytics, these show when their module is installed and you may see its page:

| Widget | Module | Permission |
|---|---|---|
| System health status | [Health](/packages/health) | `health.view` |
| Last backup | [Backup](/packages/backup) | `backups.manage` |
| Active subscriptions | [Billing](/packages/billing) | `billing.view` |
| Media storage used | [Media](/packages/media) | `media.view` |

Add your own from a module (or the project's `AppServiceProvider`):

```php
use Atrium\Core\Support\Modules\Module;

Module::contribute('dashboard.widgets', [[
    'component' => 'invoices::dashboard-card', // a Livewire component
    'permission' => 'invoices.view',            // optional; one or a list (any of)
    'order' => 60,                              // lower first
    'width' => 2,                               // 1–4 columns of the grid
]]);
```
