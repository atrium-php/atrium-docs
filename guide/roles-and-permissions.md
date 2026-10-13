# Roles & Permissions

Built on `spatie/laravel-permission`, with two permanent system roles, a `slug`/`name` split on every role, and real per-page permission checks across the backoffice.

## System roles

`atrium:install` seeds two roles:

| Role | Slug | Can |
|---|---|---|
| Super Admin | `super-admin` | Everything, always — see [Gate bypass](#gate-bypass) |
| Admin | `admin` | Everything except the [Super-Admin-only permissions](#super-admin-only-permissions) and editing portal or system roles |

Both are **locked**: nobody, Super Admin included, can edit or delete them. That's a hard rule in the Roles page, not a permission, so it can't be granted away.

The first Super Admin user comes from `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (an empty password is generated and printed once by `atrium:install`).

## Gate bypass

Atrium registers, in order:

1. a **licence** check — an ability a [paid module](/guide/build-a-module#selling-it) restricts while its licence isn't valid is denied, for Super Admin too;
2. the **Super Admin bypass** — `true` for every other ability, current and future.

Everyone else falls through to Spatie, which resolves any ability string to `hasPermissionTo()` — so there are no `Gate::define()` calls for permissions. Use them as usual: `Gate::allows('roles.edit')`, `@can('roles.edit')`, `can:roles.edit` middleware, `$this->authorize(...)`.

Portal access is separate from the Gate. The `portal:{key}` middleware lets a user in when they are Super Admin, or:

```php
match ($portal) {
    'staff' => $user->isStaff(),       // backoffice
    'user'  => ! $user->isStaff(),     // app
    default => $user->hasRoleSlug($portal),   // a portal of your own, e.g. portal:blog
};
```

Anyone else is redirected to their own portal (`$user->redirect()`).

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

The Super Admin role itself is hidden from everyone but Super Admins, in the Roles list and in user role assignment, and the server re-checks submitted role ids so it can't be smuggled in.

## Permissions

Permissions are `module.action` strings. Core owns:

```
settings.edit        modules.manage       feature-flags.manage   health.view
roles.view           roles.create         roles.edit             roles.delete
roles.assign-permissions
permissions.view     permissions.create   permissions.edit       permissions.delete
users.view           users.assign-roles
```

Each module owns its own (seeded whether the module is on or off, so role assignments survive switching it):

| Module | Permissions |
|---|---|
| activity | `activity.view`, `activity.comment` |
| api | `api.manage` |
| backup | `backups.manage` |
| billing | `billing.view`, `billing.manage` |
| currency | `currencies.view` |
| language | `languages.view/create/edit/delete`, `translations.landing`, `translations.portal`, `translations.common` |
| maintenance | `maintenance.view`, `maintenance.update` |
| media | `media.view`, `media.manage` |

### Super-Admin-only permissions

Admin's seeded set leaves out `permissions.create/edit/delete`, `modules.manage`, and whatever modules declare Super-Admin-only (`languages.*` and `translations.common` from the Language module). Your modules do the same with `superAdminOnlyPermissions()` in their provider.

Each backoffice page checks its permissions on load and on every action, and the sidebar only shows links the user can open.

## Assigning permissions to a role

Roles → **Manage Permissions** opens a page per role (`backoffice.roles.permissions`). Permissions are grouped by module prefix; each is a switch that grants or revokes immediately. The page refuses locked roles, and portal roles for anyone but Super Admin.

## Your own permissions

A module declares its permissions in its provider's `permissions()`; `atrium:install` / `db:seed` creates them and gives them to Admin (unless Super-Admin-only). See [Build (and sell) a module](/guide/build-a-module#the-module-contract).
