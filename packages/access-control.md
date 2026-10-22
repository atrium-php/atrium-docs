# Access Control

| | |
|---|---|
| Package | `atrium-php/access-control` — module `access-control`, **required**: always installed and always on |
| Namespace | `Atrium\AccessControl\` |
| Depends on | core |
| Permissions | `roles.view`, `roles.create`, `roles.edit`, `roles.delete`, `roles.assign-permissions`, `permissions.view`, `users.view`, `users.assign-roles`; Super Admin only: `permissions.create`, `permissions.edit`, `permissions.delete` |
| Pages | Backoffice → Roles (`/roles`, `/roles/{role}/permissions`), Permissions (`/permissions`), Users (`/users`), Handover (`/handover`, Super Admin only) |
| Uninstall | never — it's required |

The backoffice pages for roles, permissions and users. Every project has it: `atrium-php/skeleton` requires it, it has no on/off switch on the Modules page, and it can't be uninstalled — the whole backoffice is gated by the permissions it manages.

What stays in [core](/packages/core): the `User`, `Role` and `Permission` models, the Super Admin bypass and the seeding of Super Admin and Admin — signing in works without any module. See [Roles & Permissions](/guide/roles-and-permissions) for how roles and permissions behave.

## Pages

- **Roles** — create, rename and delete roles; the two system roles (Super Admin, Admin) are locked. Each role's permissions are toggled on their own page, grouped by module.
- **Permissions** — the catalog. Anyone with `permissions.view` can browse it; only Super Admin may create, rename or delete a permission, so Admin can't mint one and grant it to a role it made.
- **Users** — search by name, email or id; assign roles. Super Admin accounts and the role are hidden from anyone who isn't one.
- **Handover** (Super Admin only) — which Super-Admin-only permissions the client's Admin gets; see [Handover](/guide/roles-and-permissions#handover). A role's permission page only lists Super-Admin-only permissions once they're handed over.

Replace a page with your own like any Atrium page: `Platform::component('access-control::users', App\Livewire\Users::class)` — see [Customising](/guide/customising).

## Adding actions to the users list

Other modules (and your project) add buttons to each row of the users list:

```php
use Atrium\Core\Support\Modules\Module;

Module::contribute('access-control.user.actions', [[
    'label' => 'Impersonate',
    'icon' => 'user-circle',
    'href' => fn (User $user) => route('backoffice.impersonate', $user),
    'permission' => 'users.impersonate',                    // optional: any of a list
    'visible' => fn (User $user, ?User $viewer) => ! $user->is($viewer), // optional
]]);
```

An action whose `href` returns `null` is left out for that user.

## Adding to the Users page

Livewire components go in the page header, next to the search (the [Invitations](/packages/invitations) module's *Invite user* button is one):

```php
Module::contribute('access-control.users.header', [[
    'component' => 'invitations::invite',
    'permission' => 'invitations.manage',   // optional: any of a list
    'order' => 10,                          // optional
]]);
```

## Upgrading a project from an earlier alpha

Projects created before Access Control was a module don't have the package: add it, then upgrade.

```bash
composer require atrium-php/access-control
php artisan atrium:upgrade
```
