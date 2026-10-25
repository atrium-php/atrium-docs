# Command palette

| | |
|---|---|
| Package | `atrium-php/command-palette` — module `command-palette`, on once installed |
| Namespace | `Atrium\CommandPalette\` |
| Depends on | core |
| Permissions | none of its own — every page, record and action is checked against its owner's permission |
| Pages | a **Search…** button under the sidebar brand of App, Backoffice and Account; the palette opens with **Ctrl + K** (**⌘ K** on a Mac) or **/** |
| Uninstall | backup **none** — it stores nothing (recent picks live in each browser) |

One search box for the whole app: jump to any page you can open, find people and other records, and run quick actions — without hunting through the sidebar.

**With the module off or uninstalled** the Search button and the shortcut go away; nothing else changes.

## Install

```bash
php artisan module:install command-palette
```

Or Backoffice → Modules → *Available* → *Install*.

## What it shows

Open it with the sidebar's **Search…** button, **Ctrl + K** / **⌘ K**, or **/** (when you're not typing in a field). Type to narrow everything down; arrows and Enter pick, Esc closes.

| Section | What's in it |
|---|---|
| **Recent** | the last 5 things you picked, while the box is empty — kept in this browser only, per account |
| **Actions** | quick actions you're allowed to run (below), plus *Light / Dark / System theme* and *Logout* |
| **Records** | matches from each module's search, 5 per kind, once you've typed 2 characters |
| **Pages** | every sidebar page of every portal you can open, labelled with where it lives (*Backoffice · Access Control*) — staff see Backoffice, Account and (Super Admin) App; everyone else App and Account |

### Records

| Kind | Module | Permission | Matches | Opens |
|---|---|---|---|---|
| Users | Access Control | `users.view` | name, email (Super Admins stay hidden from others) | the Users page filtered on them |
| Teams | [Teams](/packages/teams) | `teams.manage` | name | Backoffice → Teams filtered on it |
| Media | [Media](/packages/media) | `media.view` | name, file name, alt text (library files only, never private ones) | the library with that file's details open |
| Currencies | [Currencies](/packages/currency) | `currencies.view` | code, name | Currencies filtered on it |
| Invitations | [Invitations](/packages/invitations) | `invitations.manage` | email | Invitations, on its status |
| Announcements | [Announcements](/packages/announcements) | `announcements.manage` | title | its editor |

### Actions

| Action | Module | Permission |
|---|---|---|
| Invite people | [Invitations](/packages/invitations) | `invitations.manage` |
| New announcement | [Announcements](/packages/announcements) | `announcements.manage` |
| Create team | [Teams](/packages/teams) | — (Account → Teams) |
| Run backup | [Backups](/packages/backup) | `backups.manage` — asks first, queues a full backup, logged like *Back up now* |

Actions that change something on the server (Run backup) are hidden and refused while [impersonating](/packages/impersonation).

## Adding your own

Contribute from your module's provider (`bootModule()`), or from a project service provider. A **search**:

```php
use Atrium\Core\Models\User;
use Atrium\Core\Support\Modules\Module;

Module::contribute('palette.search', [[
    'key' => 'invoices',
    'label' => 'Invoices',               // section heading
    'permission' => 'invoices.view',     // or a list: any of them
    'portal' => 'backoffice',            // where its links open: skipped for people who can't open it
    'search' => fn (User $viewer, string $term) => Invoice::query()
        ->where('number', 'like', "%{$term}%")
        ->limit(5)
        ->get()
        ->map(fn (Invoice $invoice) => [
            'title' => "#{$invoice->number}",
            'subtitle' => $invoice->customer_name,
            'url' => route('backoffice.invoices.show', $invoice),
            'icon' => 'document-text',
        ])
        ->all(),
]]);
```

Only the first 5 results are shown; scope the query to what `$viewer` may see. A search that throws is reported and skipped — it never breaks the palette.

An **action** is a link or something that runs:

```php
Module::contribute('palette.actions', [
    ['key' => 'invoices.create', 'label' => 'New invoice', 'icon' => 'plus',
     'permission' => 'invoices.manage', 'portal' => 'backoffice', 'route' => 'backoffice.invoices.create'],

    ['key' => 'invoices.remind', 'label' => 'Send payment reminders', 'icon' => 'bell',
     'permission' => 'invoices.manage', 'portal' => 'backoffice',
     'confirm' => 'Email every overdue customer now?',
     'run' => fn (User $viewer) => __(':count reminders queued.', ['count' => Reminders::queue($viewer)])],
]);
```

`run` gets the signed-in user and may return a message for the toast. Pages need nothing — anything in a portal's sidebar (`{portal}.nav`) is listed automatically.
