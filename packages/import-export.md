# Import / Export

| | |
|---|---|
| Package | `atrium-php/import-export` — module `import-export`, on once installed |
| Namespace | `Atrium\ImportExport\` |
| Depends on | core, Access Control, `openspout/openspout` |
| Permissions | `exports.run` — the Export buttons; `imports.run` — imports (plus each target's own: `users.import` for users). Admin has them. |
| Pages | an **Export** button on every Backoffice table; Backoffice → **Data** (your exports and imports); Data → **New import**; *Import* on the Users page |
| Config | `import-export` (below); every value also on Settings → Import / Export |
| Uninstall | backup **optional** — the lists of exports and imports come back; the files themselves are temporary and don't |

Export any Backoffice table to CSV or Excel in the background, and bring people in from a spreadsheet with a dry run first.

**With the module off or uninstalled** tables show no Export button and there's no Data page; nothing else changes.

## Install

```bash
php artisan module:install import-export
```

Or Backoffice → Modules → *Available* → *Install*. Exports and imports run on the queue — make sure a worker runs (`php artisan queue:work`), as for mail.

## Exports

Every table has an **Export** button with **CSV** or **Excel (XLSX)**:

| Table | Source | Permission | Filters it keeps |
|---|---|---|---|
| Users | `users` | `users.view` | search (Super Admins stay hidden from others, as on the page) |
| Activity | `activity` | `activity.view-all` | — |
| Currencies | `currencies` | `currencies.view` | status, search |
| Billing | `subscriptions` | `billing.view` | search, status |
| Media library | `media` | `media.view` | — (what the viewer can see in the library) |
| Teams | `teams` | `teams.manage` | search |
| Security → sign-ins | `sign-ins` | `security.manage` | search, failed only |
| Invitations | `invitations` | `invitations.manage` | status |
| Webhooks → deliveries | `webhook-deliveries` | `webhooks.manage` | — (the app's endpoints) |

The export runs in the background as the person who asked — their permissions, what they can see, the table's current filters — and is written in chunks, so big tables don't strain memory. When it's ready they're told (in-app with [Notifications](/packages/notifications), and by mail — an [editable template](/packages/mail-templates)); the file is downloaded from **Backoffice → Data**, only by them, for **7 days**. One export per table runs at a time per person; an export stops at **100 000 rows** and says so.

**Spreadsheet safety:** text starting with `=`, `+`, `-` or `@` is written with a leading `'`, so Excel, Numbers or Sheets show it instead of running it as a formula (CSV injection).

## Importing users

Users page → **Import**, or Data → **New import** (`imports.run` + `users.import`):

1. **Upload** a CSV or XLSX (first row = column names; up to 10 000 rows, 5 MB).
2. **Match columns** — guessed from the names (*Full name*, *E-mail*…): **Name** and **Email** are required; **Role**, **Country code**, **Phone**, **Language**, **Timezone** optional. Pick the options:
   - **New people:** *send an invitation* (with [Invitations](/packages/invitations) installed, the default — only email and role are used, they choose the rest when signing up) or *create the account and email them to set a password* (they get a link to *Forgot password*).
   - **Update existing accounts:** off by default — rows whose email already has an account are skipped. On: name, phone, language and timezone are updated and the role is **added**; email and password never change.
3. **Dry run** — every row is checked and **nothing is written**: how many will be added, updated, skipped or fail, with the first 50 rows and their errors.
4. **Import** — runs in the background, row by row: a bad row never stops the others. When done you're told; Data → Imports shows the counts and a **Failed rows** CSV (each row with why).

**Roles** are matched by name or slug, and only roles whose every permission the importer holds can be given (Super Admin only by a Super Admin). Accounts the importer couldn't manage aren't updated. Imports are recorded in the [Activity](/packages/activity) log.

## Configuration

| Key | `.env` | Default | Meaning |
|---|---|---|---|
| `retention_days` | `IMPORT_EXPORT_RETENTION_DAYS` | 7 | export files, uploads and reports are deleted after this (`import-export:prune`, nightly) |
| `max_export_rows` | `IMPORT_EXPORT_MAX_EXPORT_ROWS` | 100000 | most rows per export |
| `max_import_rows` | `IMPORT_EXPORT_MAX_IMPORT_ROWS` | 10000 | most rows per import |
| `max_upload_kb` | `IMPORT_EXPORT_MAX_UPLOAD_KB` | 5120 | largest import file |
| `disk` | `IMPORT_EXPORT_DISK` | `local` | private disk for the files (under `import-export/`) |

## For module authors

**An Export button for your table** — list it on `exports.sources` and put the button in the page header:

```php
Module::contribute('exports.sources', [[
    'key' => 'invoices',
    'label' => 'Invoices',
    'permission' => 'invoices.view',
    // Same visibility as the page; apply the filters you pass from it.
    'query' => fn (User $viewer, array $filters) => Invoice::query()
        ->visibleTo($viewer)
        ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status)),
    'columns' => fn () => [
        'number' => [__('Number'), fn (Invoice $invoice) => $invoice->number],
        'total' => [__('Total'), fn (Invoice $invoice) => $invoice->total_cents / 100],
        'paid_at' => [__('Paid'), fn (Invoice $invoice) => $invoice->paid_at],
    ],
]]);
```

```blade
<x-atrium::export-button source="invoices" :filters="['status' => $status]" />
```

The component renders nothing while this module is off or the viewer may not export. Return numbers as numbers and dates as dates (they're written as `Y-m-d H:i:s`); the query runs in a queued job, so use `$viewer`, never `auth()`.

**Something to import into** — implement `Atrium\Core\Contracts\ImportHandler` (`columns()`, `options()`, `check()` for the dry run, `import()` per row) and list it:

```php
Module::contribute('imports.targets', [[
    'key' => 'products',
    'label' => 'Products',
    'permission' => 'products.create',
    'handler' => ProductsImport::class,
]]);
```

See `Atrium\AccessControl\Imports\UsersImport` for a full example.

## Uninstalling

```bash
php artisan module:uninstall import-export
```

Owned data: the `exports` and `imports` tables and the four settings. Files on the disk are temporary and pruned. Backup **optional**.
