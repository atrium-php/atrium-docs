# Health

| | |
|---|---|
| Package | `atrium-php/health` — module `health`, on once installed |
| Namespace | `Atrium\Health\` |
| Depends on | core |
| Permissions | `health.view` |
| Pages | Backoffice → System health (`/system-health`) |
| Endpoint | `GET /health` on every host |
| Command | `php artisan health:check` |
| Schedule | scheduler heartbeat (every minute), status-change check (every five minutes, when `HEALTH_NOTIFY_MAIL` is set) |
| Config | `health` |
| Uninstall | no module backup (policy **none**) — it keeps nothing but a cached report |

Health checks for the whole app: a readiness endpoint for uptime monitors and load balancers, a backoffice page, a command for deploy scripts, and an email when the overall status changes.

## Install

```bash
php artisan module:install health
```

Or Backoffice → Modules → *Available* → *Install*. Without it there is no `/health`; Laravel's `/up` (liveness: the app boots) is always there.

## Endpoints

- `GET /health` — readiness, every check below. 200 when ok or warning, 503 when anything failed. Point an uptime monitor at it.
- `GET /up` — liveness only, no checks. Part of every project, with or without this module — use it for load balancers that should only drop a server that doesn't boot.

The public gets only `{"status": …}`; send `X-Health-Token: <HEALTH_TOKEN>` (or `?token=`) to see each check, and `?fresh=1` with the token to skip the 30-second report cache.

## Checks

| Check | Looks at |
|---|---|
| Database | Connection, latency, migrations a deploy forgot to run |
| Cache | Round-trip |
| Queue | Backlog, stuck jobs (is a worker running?), failed jobs, `sync` driver in production |
| Storage | Write / read / delete on each disk |
| Scheduler | Heartbeat — is `schedule:run` in cron? |
| Disk space | Free space |
| Portals | Every configured portal has a host and routes |
| Environment | Debug in production, app key, config/route cache, HTTPS |

Thresholds and probed disks are in `config/health.php`. Other modules add theirs — [Backup](/packages/backup), [Billing](/packages/billing), [Maintenance](/packages/maintenance) — and so can your project:

```php
use Atrium\Core\Support\Modules\Module;

Module::contribute('health.checks', [MyCheck::class]);   // implements Atrium\Core\Support\Health\Check
```

The `Check` contract with `Result` and `Status` lives in [core](/packages/core), so a module can ship a check without requiring this one; while Health is off or not installed, nobody runs it.

## Command

```bash
php artisan health:check            # a table; exit 1 when something failed
php artisan health:check --strict   # exit 1 on warnings too
php artisan health:check --json     # the full report, for scripts
```

## Status emails

`HEALTH_NOTIFY_MAIL=ops@example.com,dev@example.com` gets an email whenever the overall status changes (ok → failed, failed → ok, …). The scheduler runs `health:check --notify` every five minutes, so cron must run `schedule:run`.

## Environment

| Key | Default | |
|---|---|---|
| `MODULE_HEALTH` | `true` | Switch the module off without uninstalling (once `config/modules.php` reads it) |
| `HEALTH_TOKEN` | — | Unlocks per-check detail on `/health` |
| `HEALTH_CACHE_SECONDS` | `30` | How long `/health` reuses a report |
| `HEALTH_NOTIFY_MAIL` | — | Comma-separated addresses for status-change emails |

## Upgrading a project from an earlier alpha

Projects created before Health was a module don't have the package. To keep `/health`, the page and the emails, add it, then upgrade:

```bash
composer require atrium-php/health
php artisan atrium:upgrade
```

The built-in checks moved from `Atrium\Core\Support\Health\Checks\…` to `Atrium\Health\Checks\…` — update a published `config/health.php`. A replaced page is now `health::index` (was `atrium::backoffice.health`).
