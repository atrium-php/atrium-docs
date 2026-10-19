# Activity

| | |
|---|---|
| Package | `atrium-php/activity` — module `activity`, on once installed |
| Namespace | `Atrium\Activity\` |
| Depends on | core, spatie/laravel-activitylog |
| Permissions | `activity.view`, `activity.comment` |
| Pages | Backoffice → Activity Log (`/activity`) |
| Config | `activitylog` (spatie's) |
| Uninstall | backup **required** — the log is the audit trail |

A permanent audit trail — who changed what, and when — shown as a timeline with a discussion thread (comments and like/dislike) on every entry. Nothing is ever deleted: there's no delete action, route or scheduled pruning.

Two parts:

- **Core** produces the trail: models using the `Auditable` trait, plus `Audit::trail()` for anything else, fire an `Atrium\Core\Events\Audited` event. Core itself stores nothing and needs no package.
- **The Activity module** (`atrium-php/activity`) records those events into the `activity_log` table (through `spatie/laravel-activitylog`) and provides the timeline UI. With the module off, nothing is recorded.

## Install

```bash
php artisan module:install activity
```

Or Backoffice → Modules → *Available* → *Install*. Nothing else to set up; `.env` keys are optional (`ACTIVITY_LOGGER_ENABLED`, `ACTIVITY_LOGGER_TABLE_NAME`, `ACTIVITY_LOGGER_DB_CONNECTION` — spatie's).

Uninstalling always backs the log up first (policy **required**): the log, its comments and reactions come back with *Install & restore*, and the search index is rebuilt. See [Modules](/guide/modules#uninstall).

## What's tracked

Models put their own attribute changes on the trail with `Atrium\Core\Concerns\Auditable` and a list of attributes. Only listed attributes are ever recorded, and updates only record what changed — passwords, tokens and secrets simply never go in the list.

| Model | Recorded attributes |
|---|---|
| User | `name`, `email`, `privilege` |
| Role | `name`, `slug`, `locked` |
| Permission | `name` |
| AppSetting (Backoffice → Settings) | `key` — which setting changed, never its value |
| Module (Backoffice → Modules) | `module`, `state`, `enabled` |
| PortalSetting (Maintenance) | `maintenance_mode`, `message` |
| Currency | `code`, `name`, `symbol`, `decimal_digits`, `is_primary`, `is_active`, `exchange_rate`, `order` |
| Language | `code`, `name`, `native_name`, `direction`, `is_primary`, `is_active`, `order` |
| LanguageLine (Translations) | `group`, `key`, `scope`, `text` |

Many-to-many changes (granting a permission to a role, syncing a user's roles) aren't attribute changes, so Atrium records them explicitly — on both sides: the user's timeline shows "roles synced", and each role's timeline shows who it was assigned to or taken from.

## Your own models

```php
use Atrium\Core\Concerns\Auditable;

class Invoice extends Model
{
    use Auditable;

    protected function auditable(): array
    {
        return ['number', 'status', 'total'];
    }
}
```

For anything that isn't a model attribute change:

```php
use Atrium\Core\Support\Audit;

Audit::trail()                       // or Audit::trail('billing') for a named log
    ->performedOn($invoice)
    ->withProperties(['reason' => $reason])
    ->log('invoice voided');         // the causer defaults to the signed-in user
```

`Auditable` and `Audit` are `@api`, and safe to call whether or not the Activity module is installed or on.

## Showing a timeline

Three ways, all the same Livewire component from the Activity module:

1. **Inline on a record's page** — `<livewire:activity-timeline :model="$invoice" />`: that record's history, including relation changes recorded on it.
2. **In a modal** — `<x-activity::log-button :model="$invoice" />`: a small button that opens the same timeline. Atrium puts one on every row of the Roles and Users pages.
3. **Everything** — Backoffice → Activity Log (`backoffice.activity.index`): all entries, filterable by model type.

Wrap them in `@module('activity') ... @endmodule` so your views still work with the module off.

Consecutive entries with the same description (toggling the same permission on, off, on) collapse into "Show N similar activities". Icons and colours come from the event (`created` / `updated` / `deleted`).

## Comments and reactions

- **Comments** — `activity.comment`. Permanent, like the log: no edit or delete.
- **Reactions** — one like or dislike per user per comment; clicking again removes it, clicking the other switches. Anyone with `activity.view` can react.

## Permissions

`activity.view` (see the log) and `activity.comment` (comment on entries). Both go to Admin by default. There is no `activity.delete`.
