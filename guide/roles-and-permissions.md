# Roles & Permissions

Built on `spatie/laravel-permission`, with three permanent system roles, a `slug`/`name` split on every role, and real per-page permission checks across the backoffice.

## System roles

`atrium:install` seeds three roles:

| Role | Slug | Can |
|---|---|---|
| Super Admin | `super-admin` | Everything, always — see [Gate bypass](#gate-bypass) |
| Admin | `admin` | Everything except the [Super-Admin-only permissions](#super-admin-only-permissions) not [handed over](#handover), and editing portal or system roles |
| Staff | `staff` | Enter the backoffice (`backoffice.access`) — nothing else; give staff their pages with a second role |

All three are **locked**: nobody, Super Admin included, can edit or delete them. That's a hard rule in the Roles page, not a permission, so it can't be granted away.

The first Super Admin user comes from `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (an empty password is generated and printed once by `atrium:install`).

## Gate bypass

Atrium registers, in order:

1. a **licence** check — an ability a [paid module](/guide/build-a-module#selling-it) restricts while its licence isn't valid is denied, for Super Admin too;
2. the **Super Admin bypass** — `true` for every other ability, current and future.

Everyone else falls through to Spatie, which resolves any ability string to `hasPermissionTo()` — so there are no `Gate::define()` calls for permissions. Use them as usual: `Gate::allows('roles.edit')`, `@can('roles.edit')`, `can:roles.edit` middleware, `$this->authorize(...)`.

Portal access is checked by the `portal:{key}` middleware. It lets a user in when they are Super Admin, or:

```php
match ($portal) {
    'staff' => $user->isStaff(),       // backoffice
    'user'  => ! $user->isStaff(),     // app
    default => $user->hasRoleSlug($portal),   // a portal of your own, e.g. portal:blog
};
```

Anyone else is redirected to their own portal (`$user->redirect()`).

## Backoffice access

Who may enter the backoffice is a permission, **`backoffice.access`**, held through roles like any other: `$user->isStaff()` is `$user->can('backoffice.access')`. Super Admin, Admin and Staff have it; add it to a role of your own on the Roles page to make that role's users staff. To make someone staff, give them a role that has it (Users → *Assign roles*) — Staff if they only need to get in, then a role with the pages they work on.

Staff stay out of the App portal (it's for end users) — Super Admin can open both. In a query, `User::query()->staff()` finds the same users as `isStaff()`.

## Portal roles: `slug` vs `name`

A portal role (one [`make:subdomain`](/guide/make-subdomain-command) creates, e.g. `blog`) has:

- `slug` — the portal key (`blog`), matched by `portal:blog` and by the post-login redirect;
- `name` — the label (`Blog`).

A role is a portal role when its slug is a key of `config('multidomain.sub_domains')` (`Role::isPortalRole()`). Only Super Admin may edit or delete one — renaming it would break its portal. Admin can view it and assign it to users.

## What Admin can't do

- Create, edit or delete **permissions** (the catalog is Super-Admin-only).
- Edit or delete a **portal role** or a **system role**.
- **Grant a permission it doesn't hold itself** — the permission page only lists what the acting user has, so an Admin-made role can't be escalated.
- Anything [Super-Admin-only](#super-admin-only-permissions).

Super Admin is the developer, and the client never sees it: the role is hidden from everyone but Super Admins in the Roles list and in user role assignment (the server re-checks submitted role ids so it can't be smuggled in), and Super Admin **accounts** are left out of the Users list and the dashboard's user counts for everyone else (`User::visibleTo($viewer)`).

## Permissions

Permissions are `module.action` strings. Core and the required Access Control module own:

```
backoffice.access    settings.edit        modules.manage
roles.view           roles.create         roles.edit             roles.delete
roles.assign-permissions
permissions.view     permissions.create   permissions.edit       permissions.delete
users.view           users.assign-roles
```

Each module owns its own (seeded whether the module is on or off, so role assignments survive switching it):

| Module | Permissions |
|---|---|
| activity | `activity.view-all`, `activity.comment` (My Activity needs only sign-in) |
| api | `api.manage` |
| backup | `backups.manage` |
| billing | `billing.view`, `billing.manage` |
| currency | `currencies.view`, `currencies.manage` |
| feature-flags | `feature-flags.manage` |
| health | `health.view` |
| impersonation | `users.impersonate` (Super Admin only) |
| invitations | `invitations.manage` |
| language | `languages.view/create/edit/delete`, `translations.landing`, `translations.portal`, `translations.common` |
| maintenance | `maintenance.view`, `maintenance.update` |
| media | `media.view`, `media.manage`, `media.delete` (Super Admin only) |

### Super-Admin-only permissions

Admin's seeded set leaves out `permissions.create/edit/delete`, `modules.manage`, and whatever modules declare Super-Admin-only: `api.manage`, `backups.manage`, `billing.manage`, `currencies.manage`, `languages.*`, `translations.common`, `media.delete`, `notifications.broadcast` and `users.impersonate` — until they are [handed over](#handover). Your modules do the same with `superAdminOnlyPermissions()` in their provider.

Each backoffice page checks its permissions on load and on every action, and the sidebar only shows links the user can open.

## Handover

Super-Admin-only permissions belong to the developer until they are **handed over** to the client's Admin role. Admin can then pass them on to other roles as usual. They reach other roles **only** through Admin — Roles → Manage Permissions doesn't list a permission that isn't handed over, for Super Admin either — so taking one back can remove it everywhere.

**Before installing**, list what Admin gets in `config/handover.php` (`php artisan vendor:publish --tag=atrium-config`):

```php
return [
    'permissions' => ['currencies.manage', 'backups.manage'],   // or ['*'] for all of them
];
```

A fresh install, `module:install` and `atrium:upgrade` grant exactly that.

**Afterwards**, Super Admin changes it on Backoffice → Access Control → **Handover** (shown to Super Admin only): one switch per Super-Admin-only permission, grouped by module.

- On: Admin has it and can grant it to other roles.
- Off: taken back from Admin **and from every role it was passed on to** — the switch lists those roles and asks first.
- A change there is stored and wins over `config/handover.php`; **Reset to config** goes back to the file. **Hand over all** gives Admin everything, the Modules page and the permission catalog included.
- Names in the config that aren't Super-Admin-only permissions are ignored, and the screen warns about them.
- Each change is in the activity log as a sentence ("handed currencies.manage over to role Admin"), one grouped entry per save.

Every `atrium:upgrade` re-applies the handover: a Super-Admin-only permission that isn't handed over is removed from every role but Super Admin, even if it was added in the database directly.

::: warning The handover is a line inside the app
Whoever can write to the database or the server (`.env`, code) controls the app — they could put themselves in the Super Admin role. Keep database, SSH and hosting-panel access with the developer while you run the project; once the client hosts it, the handover only governs what their staff can do in the backoffice.
:::

In code: `Atrium\Core\Support\Handover` (`handedOver()`, `adminMay($permission)`, `update([...])`, `reset()`).

## Assigning permissions to a role

Roles → **Manage Permissions** opens a page per role (`backoffice.roles.permissions`). Permissions are grouped by module prefix; each is a switch that grants or revokes immediately. The page refuses locked roles, and portal roles for anyone but Super Admin.

## Your own permissions

A module declares its permissions in its provider's `permissions()`; `atrium:install` / `db:seed` creates them and gives them to Admin (unless Super-Admin-only). See [Build (and sell) a module](/guide/build-a-module#the-module-contract).
