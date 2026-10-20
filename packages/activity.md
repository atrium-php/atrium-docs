# Activity

| | |
|---|---|
| Package | `atrium-php/activity` — module `activity`, on once installed |
| Namespace | `Atrium\Activity\` |
| Depends on | core, spatie/laravel-activitylog |
| Permissions | `activity.view-all`, `activity.comment` |
| Pages | Backoffice → Activity (`/activity`); Account → My Activity (`/activity`); Backoffice → Settings → Activity |
| Config | `activitylog` (spatie's) |
| Schedule | `activitylog:clean` daily at 02:00 — only once a retention is set |
| Uninstall | backup **required** — the log is the audit trail |

A permanent audit trail — who changed what, and when — shown as a readable timeline ("Lian disabled currency EUR") with a discussion thread (comments and like/dislike) on every entry. There's no delete action or route; entries are only removed by the optional retention setting.

Two parts:

- **Core** produces the trail: models using the `Auditable` trait, plus `Audit::trail()` for anything else, fire an `Atrium\Core\Events\Audited` event. Core itself stores nothing and needs no package.
- **The Activity module** (`atrium-php/activity`) records those events into the `activity_log` table (through `spatie/laravel-activitylog`) and provides the timelines. With the module off, nothing is recorded.

## Install

```bash
php artisan module:install activity
```

Or Backoffice → Modules → *Available* → *Install*. Nothing else to set up; `.env` keys are optional (`ACTIVITY_LOGGER_ENABLED`, `ACTIVITY_LOGGER_TABLE_NAME`, `ACTIVITY_LOGGER_DB_CONNECTION` — spatie's).

Uninstalling always backs the log up first (policy **required**): the log, its comments and reactions come back with *Install & restore*, and the search index is rebuilt. See [Modules](/guide/modules#uninstall).

## Two views

| View | Who | Shows |
|---|---|---|
| **Account → My Activity** | anyone signed in | only what they did themselves, including their own account and security changes |
| **Backoffice → Activity** | `activity.view-all` | everyone's activity, with filters |

My Activity is scoped on the server: every query, including search, only returns entries the signed-in user caused, and the scope can't be changed from the browser. It has no comments or reactions. Account and security entries carry a *Wasn't you?* link to Account → Security.

Backoffice → Activity filters by **who** (any user who appears in the log, or *System*), **what** (model type), **action** (created / changed / deleted / other) and **date range**, plus a full-text search. Exporting to CSV is planned in the Import / Export module.

## Reading an entry

Entries read like sentences, never raw columns:

> **Lian** disabled currency EUR
> Status: Enabled → Disabled

- **Headline** — "{who} {what}". On My Activity *who* is **You**.
- **Changes** — one line per field, with a readable label (`is_active` → *Status*), readable values (booleans as *Yes / No* or the model's own words, dates in the viewer's timezone, `role_id` → the role's name), long text collapsed to *changed* with *show*.
- **Never shown** — internal keys (`id`, timestamps, keys starting with `_`). Anything that looks secret (`password`, `token`, `secret`, `*_key`, …) is masked as `••••`; secret settings are never stored in the first place.
- **Grouped** — changes made together (a bulk action, one Settings save) are one entry, e.g. *Lian enabled 5 currencies*, with the individual changes under *Show all 5 changes*.
- Consecutive identical entries on the same record (toggling one permission on, off, on) collapse into *Show N similar activities*.

## What's tracked

Models put their own attribute changes on the trail with `Atrium\Core\Concerns\Auditable` and a list of attributes. Only listed attributes are ever recorded, and updates only record what changed.

| Model | Recorded attributes |
|---|---|
| User | `name`, `email`, `privilege` |
| Role | `name`, `slug`, `locked` |
| Permission | `name` |
| AppSetting (Backoffice → Settings) | `key`, `value` — secret values are blanked before storing |
| Module (Backoffice → Modules) | `module`, `state`, `enabled` |
| PortalSetting (Maintenance) | `maintenance_mode`, `message` |
| Currency | `code`, `name`, `symbol`, `decimal_digits`, `is_primary`, `is_active`, `exchange_rate`, `order` |
| Language | `code`, `name`, `native_name`, `direction`, `is_primary`, `is_active`, `order` |
| LanguageLine (Translations) | `group`, `key`, `scope`, `text` |

Recorded explicitly (log `account`, the user as subject): email change asked / cancelled, phone changed, password changed, another session or all other sessions signed out, two-factor turned on / off / reset, new recovery codes, preferences (language, timezone) changed, data export requested, account deletion asked / cancelled. Sign-in history (logins, failed attempts, devices) belongs to the planned Security Center module.

Many-to-many changes (granting a permission to a role, changing a user's roles) are recorded on both sides: the user's timeline shows *changed the roles of Sam*, each role's timeline shows who it was given to or taken from.

## Your own models

```php
use Atrium\Core\Concerns\Auditable;

class Invoice extends Model
{
    use Auditable;

    protected function auditable(): array
    {
        return ['number', 'status', 'total', 'customer_id'];
    }

    // All optional — how the timeline words it.
    public function auditHeadline(string $event, array $new, array $old): ?string
    {
        return ($new['status'] ?? null) === 'void' ? 'voided invoice :subject' : null;
    }

    public function auditLabels(): array
    {
        return ['total' => 'Amount', 'customer_id' => 'Customer'];
    }

    public function auditFormats(): array
    {
        return [
            'is_paid' => ['Unpaid', 'Paid'],
            'total' => fn ($cents) => (new Money($cents, 'USD'))->format(),
        ];
    }
}
```

| Hook | Default |
|---|---|
| `auditHeadline($event, $new, $old)` | *created / updated / deleted :model :subject* |
| `auditLabels()` | the column, humanised without `is_` / `_id` |
| `auditFormats()` | booleans *Yes / No*; `*_id` → the related record's name when the model has that `belongsTo` |
| `auditSecrets()` | attributes always masked (on top of the name-based rules) |
| `auditModelLabel()` | the class name in lower case: *invoice* |
| `auditSubjectLabel()` | `ACTIVITY_LABEL` constant, else `name` |
| `auditRedact($values)` (protected) | nothing — blank values that must never be stored |

The hooks are read when an entry is shown, so rewording them rewords old entries too. `:subject` and `:model` are filled in; sentences go through `__()`, so they can be translated.

For anything that isn't a model attribute change:

```php
use Atrium\Core\Support\Audit;

Audit::trail()                       // or Audit::trail('billing') for a named log
    ->performedOn($invoice)
    ->withProperties(['reason' => $reason])
    ->headline('voided invoice :subject because :reason', ['reason' => $reason])
    ->log('invoice voided');         // the causer defaults to the signed-in user
```

Group several changes into one entry:

```php
Audit::batch(function () use ($invoices) {
    $invoices->each->markPaid();
}, 'marked :count invoices as paid');   // :count = number of entries in the batch
```

`Auditable` and `Audit` are `@api`, and safe to call whether or not the Activity module is installed or on.

## Showing a timeline

All the same Livewire component from the Activity module:

1. **Inline on a record's page** — `<livewire:activity-timeline :model="$invoice" />`: that record's history, including relation changes recorded on it.
2. **In a modal** — `<x-activity::log-button :model="$invoice" />`: a small button that opens the same timeline. Atrium puts one on every row of the Roles, Users and Billing pages.
3. **Everything** — Backoffice → Activity (`backoffice.activity.index`).
4. **Mine** — Account → My Activity (`account.activity`), or `<livewire:activity-timeline scope="own" />`.

Record and *everything* timelines need `activity.view-all`; *own* needs only a signed-in user. Wrap them in `@module('activity') ... @endmodule` so your views still work with the module off.

## Comments and reactions

- **Comments** — `activity.comment`. Permanent, like the log: no edit or delete.
- **Reactions** — one like or dislike per user per comment; clicking again removes it, clicking the other switches. Anyone with `activity.view-all` can react.

Neither appears on My Activity.

## Retention

Settings → Activity → **Keep entries for (days)**. Empty (the default) keeps everything forever. Once set, `activitylog:clean` runs nightly at 02:00 and deletes older entries with their comments — keep Laravel's scheduler running. The value overrides spatie's `activitylog.delete_records_older_than_days`.

## Permissions

`activity.view-all` (Backoffice → Activity, record timelines, reactions) and `activity.comment` (comment on entries). Both go to Admin by default. There is no `activity.delete`. Anyone signed in sees their own My Activity.

Upgrading from a release with `activity.view`: `atrium:upgrade` renames it to `activity.view-all` and every role or user that had it keeps it.
