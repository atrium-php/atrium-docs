# Cross-Subdomain SSO

With portals on separate subdomains, users would have to sign in on each one unless they share the session cookie. Atrium shares it through Laravel's own `SESSION_DOMAIN`.

## The setting

```sh
SESSION_DOMAIN=.yourapp.test
```

The leading dot makes the cookie valid on `yourapp.test` and every subdomain. Signing in on `auth.yourapp.test` then keeps you signed in on `app.`, `account.` and `backoffice.yourapp.test`. A new project's `.env.example` already sets it for `yourapp.test` — change it along with `APP_MAIN_DOMAIN`.

## Single-domain mode

With [`APP_SINGLE_DOMAIN=true`](/guide/single-vs-multi-domain), leave `SESSION_DOMAIN=null`: a host-only cookie is right when there's one host.

## Checking it works

1. Sign in at `auth.yourapp.test/login`.
2. Open `app.yourapp.test` (or `backoffice.yourapp.test` as staff).
3. You land on the dashboard instead of being sent back to sign in.

If you're sent back to sign in, check that `SESSION_DOMAIN` matches `APP_MAIN_DOMAIN` with a leading dot, and clear the browser's old cookies for the domain.
