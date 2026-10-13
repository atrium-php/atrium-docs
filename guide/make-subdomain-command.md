# make:subdomain Command

Adds a portal of your own to the project: its CSS/JS entries, a Blade layout, a first Livewire dashboard page, a route file, and a role for its users.

```bash
php artisan make:subdomain blog
```

The name must be lowercase letters, digits and dashes (`blog`, `partner-portal`), mustn't already be a portal, and the command refuses to run while `APP_SINGLE_DOMAIN=true` (a new portal's `/` would collide).

## Prompts

- **Who should be able to access this portal?** — `open` (no sign-in) or `auth`.
- **Access level** (only for `auth`) — the portal's own role (recommended: a `blog` role, checked by `portal:blog`), `user` (same rule as the app portal) or `staff` (same rule as the backoffice).
- **Should visitors be able to sign up for this portal themselves?** — if yes, the label shown on the sign-up form (e.g. "Blog Writer").
- **Error & maintenance page style?** — `shared` (the default design), `landing` (landing's design) or `own` (a blank page to design). See [Error Pages](/guide/error-pages).

## What it creates

All in your project:

```
resources/css/blog.css
resources/js/blog.js
resources/views/layouts/blog.blade.php
resources/views/pages/blog/⚡dashboard/dashboard.php
resources/views/pages/blog/⚡dashboard/dashboard.blade.php
routes/blog.php
resources/views/errors/blog/page.blade.php      (only with the "own" page style)
```

And a role with slug `blog` and name `Blog`, ready to assign. Only Super Admin can edit or delete it, because the `portal:blog` middleware and the post-login redirect match on that slug (see [Roles & Permissions](/guide/roles-and-permissions)).

`vite.config.js` picks up the new `resources/css/*` and `resources/js/*` entries by itself.

## The manual steps it prints

The command doesn't edit PHP files it doesn't own — a code generator rewriting your config is fragile. It prints the exact lines instead:

1. **Once per project:** `php artisan vendor:publish --tag=atrium-config` — copies Atrium's portal config to `config/multidomain.php` (a new project doesn't have one; Atrium's defaults apply until you copy it). The command skips this step when the file exists.
2. Add `'blog' => 'blog.'.env('APP_MAIN_DOMAIN')` to the `sub_domains` array in `config/multidomain.php`.
3. Include the route file from `routes/web.php`:
   ```php
   Route::domain(config('multidomain.sub_domains.blog'))->name('blog.')
       ->group(fn () => include __DIR__.'/blog.php');
   ```
4. Add `blog.yourapp.test` to Herd or your hosts file.
5. Assign the `blog` role to the users who should use the portal and land there after signing in.
6. Only if you allowed sign-up: add `'blog' => 'Blog Writer'` to `registerable_portals` in `config/multidomain.php`.
7. Only if the page style isn't `shared`: add `'blog' => 'own'` (or `'landing'`) to `page_style` in `config/multidomain.php`.

`config/multidomain.php` is then your copy of an Atrium file: `atrium-overrides.json` tracks it, and `php artisan atrium:overrides` tells you when Atrium's original changes (see [Customising](/guide/customising#your-copies-of-atrium-files)).

### Self-registration

The register page's "Select the user type" dropdown and the dashboard's Register button read `config('multidomain.registerable_portals')`; nothing shows until step 6 adds the portal. Signing up with that user type assigns the role, so the new user is sent straight to their portal.

## Changing the templates

The templates ship with Atrium. To change what every new portal looks like, copy them into the project and edit the copies:

```bash
php artisan vendor:publish --tag=atrium-stubs     # → stubs/subdomain/*.stub
```

A file in the project's `stubs/` wins over Atrium's.

| Stub | Produces |
|---|---|
| `css.stub` | `resources/css/{name}.css` — imports the shared `theme.css` |
| `js.stub` | `resources/js/{name}.js` |
| `layout.stub` | `resources/views/layouts/{name}.blade.php` |
| `route.stub` | `routes/{name}.php` |
| `dashboard.stub` / `dashboard.blade.stub` | the first Livewire page |
| `error-page.stub` | `resources/views/errors/{name}/page.blade.php` (`own` style only) |
