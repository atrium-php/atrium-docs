# Billing

| | |
|---|---|
| Package | `atrium-php/billing` — module `billing`, **off by default** (`MODULE_BILLING=true` to switch on) |
| Namespace | `Atrium\Billing\` |
| Depends on | core, Laravel Cashier (Stripe) |
| Permissions | `billing.view`, `billing.manage` (Super Admin only — it moves real money) |
| Pages | Account → Billing (`/billing`, every user); Backoffice → Billing (`/billing`) |
| Routes | `stripe/webhook` and `stripe/payment/{id}` (Cashier's, any host) |
| Config | `billing` (plans), `cashier` |

Subscriptions through Stripe Checkout and the Stripe Billing Portal, on Laravel Cashier. Stripe customers live in their own `billing_customers` table (`BillingCustomer`, one per user) instead of columns on `users`, so the user model stays untouched.

## Setting up

1. In Stripe, create a product with a recurring **price** per plan; copy the price ids (`price_…`).
2. `.env`:
   ```sh
   MODULE_BILLING=true
   STRIPE_KEY=pk_…
   STRIPE_SECRET=sk_…
   STRIPE_WEBHOOK_SECRET=whsec_…
   BILLING_STARTER_PRICE=price_…
   BILLING_PRO_PRICE=price_…
   BILLING_TRIAL_DAYS=0
   ```
3. Add a webhook endpoint in Stripe pointing at `https://yourapp.test/stripe/webhook` (Cashier's events). Without `STRIPE_WEBHOOK_SECRET` the endpoint answers 503, so Stripe keeps retrying until it's set — unsigned webhooks are never accepted.

Backoffice → System health shows the module's check: failed while a Stripe key, secret or webhook secret is missing or no plan has a price id; a warning while subscriptions are past due.

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
