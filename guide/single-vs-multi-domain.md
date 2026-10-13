# Single vs Multi Domain

By default Atrium puts each portal on its own subdomain of `APP_MAIN_DOMAIN`: `auth.`, `account.`, `app.`, `backoffice.`, and the bare domain for landing. Some apps want that separation (different caching/CDN rules, a clear sense of "which area am I in"). Others don't.

## The toggle

```sh
APP_SINGLE_DOMAIN=false   # default: one subdomain per portal
APP_SINGLE_DOMAIN=true    # every portal on APP_MAIN_DOMAIN
```

Atrium resolves each portal's host into `config('multidomain.sub_domains')` and registers every portal's routes with `Route::domain(...)` on that host. With the toggle on, every portal gets the same host, and the portals that would otherwise clash move under a path:

| Portal | Multi-domain | Single-domain |
|---|---|---|
| landing | `yourapp.test/` | `yourapp.test/` |
| auth | `auth.yourapp.test/login` | `yourapp.test/login` |
| app | `app.yourapp.test/` | `yourapp.test/app` |
| account | `account.yourapp.test/` | `yourapp.test/account` |
| backoffice | `backoffice.yourapp.test/` | `yourapp.test/backoffice` |

Always link with `route('app.dashboard')` and friends, never hard-coded URLs, so links work in both modes.

Use `config('multidomain.sub_domains.app')` (not a hard-coded host) wherever your own code needs a portal's domain, so it works in both modes.

## Route collisions

On one host, route **URIs** across portals must not collide. Atrium's own portals stay apart through the prefixes above; your own routes are your responsibility — prefix them (`Route::prefix('blog')->group(...)`) if they clash.

`make:subdomain` refuses to run while `APP_SINGLE_DOMAIN=true`, because a new portal's `/` would collide.

## Sessions

In single-domain mode leave `SESSION_DOMAIN=null` — there's only one host. See [Cross-Subdomain SSO](/guide/sso-sessions) for the multi-domain case.
