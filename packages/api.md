# API

| | |
|---|---|
| Package | `atrium-php/api` — module `api`, **off once installed** — switch it on on Backoffice → Modules |
| Namespace | `Atrium\Api\` |
| Depends on | core, Laravel Sanctum |
| Permissions | `api.manage` (Super Admin only) |
| Pages | Backoffice → API Access (`/api`); Account → API tokens (`/api-tokens`) for users the policy allows |
| User model | implements `Laravel\Sanctum\Contracts\HasApiTokens`, uses `Laravel\Sanctum\HasApiTokens` — add both when you install it |
| Config | `api` (below), `sanctum` |
| Uninstall | backup optional; tokens are **never restored** |

A versioned, token-authenticated JSON API on its own subdomain: `https://api.yourapp.test/v1`, or `/api/v1` in [single-domain mode](/guide/single-vs-multi-domain). Sanctum personal access tokens only — a portal session never authenticates an API request.

## Install

```bash
php artisan module:install api
```

Or Backoffice → Modules → *Available* → *Install*. Then:

1. Add Sanctum to your user model:

   ```php
   use Laravel\Sanctum\Contracts\HasApiTokens as HasApiTokensContract;
   use Laravel\Sanctum\HasApiTokens;

   class User extends \Atrium\Core\Models\User implements HasApiTokensContract
   {
       use HasApiTokens;
   }
   ```

2. Switch the module on (Backoffice → Modules) and point the `api.` subdomain at `public/` like the other portals.

`.env`: `API_RATE_LIMIT` (requests per minute, default 60), and Sanctum's `SANCTUM_TOKEN_PREFIX`.

Uninstalling backs up the access policy and token metadata when you keep the backup (policy **optional**), but **tokens are never restored** — after a restore, users create new ones. Remove the two lines from your user model before the module's code is removed.

## Who gets API access

A Super Admin sets the policy on **Backoffice → API Access**:

| Policy | Who can create their own tokens (Account → API tokens) |
|---|---|
| **Nobody** (default) | no one — only admins issue tokens; the page doesn't exist for users |
| **Backoffice staff** | staff accounts |
| **Everyone** | every signed-in user |
| **Specific roles** | users with one of the chosen roles (e.g. a `partner` role) |

For self-service tokens the policy also sets which **abilities** users may pick, the **longest lifetime** and **how many tokens** each user may hold. The page shows how many users the policy currently covers.

The policy is **checked on every request**: when a user falls outside it (policy tightened, role removed), the tokens they created stop working immediately (403).

**Admin-issued tokens** (API Access → *Issue a token*) go to any user — an integration or service account, say — with any ability including full access (`*`) and any lifetime. The self-service policy doesn't apply to them. The owner sees them labelled *Issued by …*, read-only if they can't self-serve.

Whatever the token, **it never grants more than its user's permissions** — abilities only narrow it down.

## Oversight

- **All tokens** — owner, abilities, issuer (*Self* or the admin), last use, expiry; search and revoke any.
- **Revoke all** — an emergency stop.
- **Audit** — creating and revoking tokens and policy changes go on the [activity log](/packages/activity) (log `api`).
- **Account deletion** — requesting it revokes the account's tokens at once, and while the deletion is pending the API refuses every token of the account (403), even one an admin issues in the meantime. Cancelling the deletion lifts the block; revoked tokens must be created again.

## Endpoints

| Method | Path | Ability | |
|---|---|---|---|
| `GET` | `/v1/me` | `profile:read` | The token's user |
| | `/v1/languages…` | `languages:read` / `:write` | From the [Language module](/packages/language#api-endpoints) |

Errors are always JSON: 401, 403, 404 (unknown routes too), 422 with field errors, 429 with `Retry-After`.

## Adding endpoints from a module

Put them in the module's `routes/api.php`. It's loaded inside the authenticated `/v1` group (token, JSON, rate limit, policy check), only while both the API module and your module are on:

```php
Route::get('invoices', [InvoiceController::class, 'index'])
    ->middleware('ability:invoices:read')
    ->name('invoices.index');   // → route('api.v1.invoices.index')
```

Declare the ability so it shows on the token forms:

```php
// in the module's bootModule()
Module::contribute('api.abilities', [
    ['ability' => 'invoices:read', 'description' => 'Read invoices'],
]);
```

Check the user's permission in the controller or form request (`Gate::authorize(...)`, `authorize()`) as well — the ability only says what the token may try. `ability:` passes with any of the listed abilities, `abilities:` needs all.

Create tokens in code through `Atrium\Api\Services\TokenIssuer` (`issueForSelf()`, `issueFor()`), not a bare `$user->createToken()`: a token without a recorded issuer counts as self-issued, so the self-service policy applies to it.

## Configuration

| Key | |
|---|---|
| `version` | URL prefix (`v1`) |
| `rate_limit` / `API_RATE_LIMIT` | requests per minute per token user, or per IP (default 60) |
| `max_per_page` | upper bound for `?per_page=` (100) |
| `abilities` | core's abilities (`profile:read`); modules add theirs |
| `token_expiry_days` | lifetime choices on the token forms: 7, 30, 90, 365, never |
| `policy` | the access policy's defaults until a Super Admin saves one: nobody self-serves, `profile:read`, 90 days, 5 tokens |
