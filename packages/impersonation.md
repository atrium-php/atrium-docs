# Impersonation

| | |
|---|---|
| Package | `atrium-php/impersonation` — module `impersonation`, on once installed |
| Namespace | `Atrium\Impersonation\` |
| Depends on | core (its button sits on [Access Control](/packages/access-control)'s Users page) |
| Permissions | `users.impersonate` (**Super Admin only** until [handed over](/guide/roles-and-permissions#handover)) |
| Pages | *Log in as* on Backoffice → Users; a banner above every page while viewing as someone; Backoffice → Settings → Impersonation |
| Config | `impersonation` (below); both values also on Settings → Impersonation |
| Uninstall | backup **none** — it keeps no data |

Support staff "log in as" a user to see exactly what they see — to reproduce a problem, check a page, walk them through something. Safely: a reason is required, a banner shows on every page, it ends on its own, sensitive actions are refused, and everything is in the activity log.

**With the module off or uninstalled nothing breaks.** A session still viewing as someone at that moment is signed out — support never stays in someone's account without the banner and the blocks.

## Install

```bash
php artisan module:install impersonation
```

Or Backoffice → Modules → *Available* → *Install*. Nothing to add to your user model.

## Logging in as someone

Backoffice → Users → **Log in as** on a user's row → a **reason** (required, 5–500 characters, e.g. a ticket number) → you're signed in as them, on their own portal.

Who you can view as:

- never yourself, never a **Super Admin**;
- only someone **within your reach**: every permission they have (through roles or directly), you have too — so an Admin can't view as someone holding a permission Admin doesn't (`User::isWithinReachOf()`);
- not while you're already viewing as someone.

A **banner** above every page says *Viewing as Name (email)*, the minutes left, and has **Stop**. **Logout** while viewing as someone also just stops — a second logout signs you out.

It ends on its own after **30 minutes** (Settings → Impersonation, 5–240) at the next page load, back on your own account. If your account loses `users.impersonate` (or is deleted) meanwhile, the session is signed out.

## What's blocked

While viewing as someone these are refused with *"Not while viewing as someone else"*:

| | |
|---|---|
| Account | changing email or phone, verification codes, deleting the account (or cancelling it), password, signing out sessions, two-factor setup (page closed), data export and its download |
| Backoffice | Settings, Modules, Roles, Permissions, Handover, assigning roles on Users, inviting / resending / revoking ([Invitations](/packages/invitations)), saving / publishing / duplicating / deleting [Announcements](/packages/announcements) |
| Modules | Billing (both pages), API tokens and the API access policy, logging in as someone again |

Everything else works — browsing, forms, the app's own actions — so problems can be reproduced.

### Blocking your own actions

Declare them from your module's provider (or the project's `AppServiceProvider`); they only count while the Impersonation module is on:

```php
use Atrium\Core\Support\Modules\Module;

Module::contribute('impersonation.blocked', [
    ['component' => 'invoices::show', 'methods' => ['refund', 'cancel']], // these Livewire actions
    ['component' => 'invoices::payouts', 'methods' => '*'],               // every action on the page
    ['route' => 'app.invoices.download'],                                 // the page / route itself
]);
```

A component is matched by its name and by whatever replaced it with `Platform::component()`. With `'*'`, Livewire's own `$set` / `$refresh` still work.

## Audit trail and transparency

- *started viewing as Ada Lovelace* (with the reason) and *stopped viewing as …* (with how long, and whether it was Stop, logout or the time limit) go into the `impersonation` log ([Activity](/packages/activity)), caused by the support person.
- Every other entry made meanwhile is caused by the user, with `impersonator` (id and name) in its properties — any module's entries, through core's `audit.context` point.
- The user's Account → Security lists the session as **Support (viewing as you)**.
- **Tell users when support viewed their account** (Settings → Impersonation, off by default): an email and an in-app notification ([Notifications](/packages/notifications)) with the support person's name and the reason. Users can't switch it off.

## Configuration

`config('impersonation')`, from the package's `config.php`:

| Key | `.env` | Default | |
|---|---|---|---|
| `timeout_minutes` | `IMPERSONATION_TIMEOUT_MINUTES` | `30` | Ends on its own after this long |
| `notify_user` | `IMPERSONATION_NOTIFY_USER` | `false` | Tell users when support viewed their account |

## For module authors

- `Atrium\Core\Contracts\Impersonation` — `active()`, `impersonator()`, `stop()`; `NullImpersonation` without this module. Use it to skip things for impersonated sessions (a login history should ignore them).
- Events `Atrium\Impersonation\Events\ImpersonationStarted` (impersonator, user, reason) and `ImpersonationStopped` (impersonator, user, why). Laravel's `Login` event also fires on each switch — `active()` is already true inside it, on starting and on stopping, so a `Login` listener can skip both (the [Analytics](/packages/analytics) module does).
- Core points this module uses: `shell.banners` (components above every page), `audit.context` (properties on every audit entry), `impersonation.blocked`; and Access Control's `access-control.user.actions` with `dispatch` and `access-control.users.header`.
