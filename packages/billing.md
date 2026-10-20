# Billing

| | |
|---|---|
| Package | `atrium-php/billing` — module `billing`, **off once installed** — switch it on on Backoffice → Modules |
| Namespace | `Atrium\Billing\` |
| Depends on | core, Laravel Cashier (Stripe) |
| Permissions | `billing.view`, `billing.manage` (Super Admin only — it moves real money) |
| Pages | Account → Billing (`/billing`, every user); Backoffice → Billing (`/billing`) |
| Routes | `stripe/webhook` and `stripe/payment/{id}` (Cashier's, any host) |
| Config | `billing` (plans), `cashier` |
| Uninstall | backup **required**; blocked while subscriptions are active, trialing, past due or in their grace period |

Subscriptions through Stripe Checkout and the Stripe Billing Portal, on Laravel Cashier. Stripe customers live in their own `billing_customers` table (`BillingCustomer`, one per user) instead of columns on `users`, so the user model stays untouched.

## Install

```bash
php artisan module:install billing
```

Or Backoffice → Modules → *Available* → *Install*. Then follow [Setting up](#setting-up) and switch it on.

**Uninstalling** is refused while any subscription is active, trialing or past due, or cancelled but still in its grace period — cancel them first (Backoffice → Billing). The data (customers, subscriptions) is always backed up first (policy **required**).

## Setting up

1. In Stripe, create a product with a recurring **price** per plan; copy the price ids (`price_…`).
2. `.env`:
   ```sh
   STRIPE_KEY=pk_…
   STRIPE_SECRET=sk_…
   STRIPE_WEBHOOK_SECRET=whsec_…
   BILLING_STARTER_PRICE=price_…
   BILLING_PRO_PRICE=price_…
   BILLING_TRIAL_DAYS=0
   ```
3. Create the webhook endpoint: `php artisan cashier:webhook` points it at `https://<APP_URL>/stripe/webhook` with the events Cashier handles. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`. The route answers on any host and needs no CSRF token. Without the secret the endpoint answers 503, so Stripe keeps retrying until it's set — unsigned webhooks are never accepted.
4. In Stripe → Settings → Billing → Customer portal, turn on what customers may do: update cards, switch plans, cancel. For plan switching, add your plan prices to the portal's product catalogue.
5. Switch the module on (Backoffice → Modules).

Locally, forward webhooks with `stripe listen --forward-to <your-local-url>/stripe/webhook` and use the `whsec_…` secret it prints.

Backoffice → System health shows the module's check: failed while a Stripe key, secret or webhook secret is missing or no plan has a price id; a warning while subscriptions are past due.

## Settings → Billing

Super Admin can keep the Stripe keys out of `.env`: Backoffice → Settings → **Billing** takes the publishable key, the secret key and webhook signing secret (stored encrypted, never shown again), the currency, the free trial and each plan's price id and displayed price. A stored setting wins over `.env`; empty falls back to it.

## Plans

Defined in the module's config (`billing.plans`) — two to start with:

| Plan | Price id | Shown price |
|---|---|---|
| Starter | `BILLING_STARTER_PRICE` | `BILLING_STARTER_AMOUNT` (`$9 / month`) |
| Pro | `BILLING_PRO_PRICE` | `BILLING_PRO_AMOUNT` (`$29 / month`) |

Stripe charges the price on its side; the amount text is only what the page shows. A plan without a price id isn't offered. For other plans or features, create `config/billing.php` in the project with your own `plans` (name, description, price, amount, features) — it wins over the module's.

## Account → Billing

What each user sees:

- **No subscription** — the plans, each with **Subscribe** → Stripe Checkout (with the trial, if `BILLING_TRIAL_DAYS` > 0) → back to the page.
- **Subscribed** — plan, status and next renewal; **Manage billing** opens the Stripe Billing Portal (cards, invoices, plan changes); **Cancel** stops renewal at the end of the period; **Resume** undoes that during the grace period.

The Stripe customer is only created when the user subscribes, never by just opening the page.

## Backoffice → Billing

- Counts: active, trialing, cancelling (grace period), past due.
- Every subscription with its user, plan and status; search and filter by status.
- With `billing.manage`: **cancel** at period end, **cancel now**, **resume**. Each is written to the [activity log](/packages/activity), as are subscription changes Stripe reports by webhook.

## Account deletion

- When a deletion is carried out, the user's subscriptions are **cancelled immediately** first; if that fails, the deletion waits and retries.
- On anonymisation the stored card brand and last four digits are cleared — even while the module is switched off, since that's still personal data.

## In code

Cashier's API works on the user's `BillingCustomer`:

```php
use Atrium\Billing\Models\BillingCustomer;

$customer = BillingCustomer::for($user);              // created on first use
$customer->subscribed(config('billing.subscription')); // 'default'
$customer->subscription('default')?->onGracePeriod();
```

To gate your own features on a plan, check the subscription's `stripe_price` against `config('billing.plans.pro.price')`.

## Switching it off

Turning the module off removes the pages, the nav links and the `/stripe/*` routes. The tables and Stripe ids stay, so switching it back on needs no setup. Stripe keeps billing existing subscribers while the module is off, and webhooks get a 404 in the meantime: Stripe retries them for up to three days, then they are lost. Switch it off only when no one is subscribed.

## Outside Atrium

Refunds, coupons, tax and invoice changes are handled in the Stripe dashboard. To use Paddle instead of Stripe, replace `laravel/cashier` with `laravel/cashier-paddle` and adapt the module in a package of your own — the two share most of their API, but webhooks and checkout differ.
