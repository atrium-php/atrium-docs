# Webhooks

| | |
|---|---|
| Package | `atrium-php/webhooks` — module `webhooks`, on once installed |
| Namespace | `Atrium\Webhooks\` |
| Depends on | core; sends events from other modules while they're on |
| Permissions | `webhooks.manage` — the app's endpoints, every user's endpoint, Settings → Webhooks (Admin has it) |
| Pages | Backoffice → Webhooks; Account → Webhooks (when the policy allows); Backoffice → Settings → Webhooks |
| Config | `webhooks` (below); four values also on Settings → Webhooks |
| Uninstall | backup **optional** — endpoints are restored, the delivery log never is |

When something happens in the app — someone signs up, a subscription starts, a team gains a member — Atrium sends a signed JSON request to the URLs that asked for it. Use it to feed a CRM, Zapier, Slack, a data warehouse or your customers' own systems.

**With the module off or uninstalled** no event turns into a delivery; nothing else changes.

## Install

```bash
php artisan module:install webhooks
```

Or Backoffice → Modules → *Available* → *Install*. Deliveries go through the queue — run a [queue worker](/guide/deploying#queue-worker-and-scheduler).

## Endpoints

| | Who manages it | Receives |
|---|---|---|
| **App endpoint** | Backoffice → Webhooks (`webhooks.manage`) | any event it picks |
| **User endpoint** | the user, on Account → Webhooks | only events **about that user**, never staff-only ones |

Users can add endpoints only when **Settings → Webhooks → Who can add their own endpoints** allows it: *Nobody* (default), *Staff*, *Chosen roles* or *Everyone*, up to **5 each** (1–50). If the policy is tightened later, users keep seeing their endpoints (to delete them) but can't add or edit.

For each endpoint: URL, description, the events it wants, and

- **Signing secret** (`whsec_…`) — shown on demand, **New secret** replaces it (the old one stops verifying at once);
- **Switch off / on**;
- **Send test event** — a sample of one of its events, with `"test": true`;
- **Deliveries** — the last 25 with status, attempts, timing, the body sent and the response (first 2 KB), and **Redeliver**.

Backoffice → Webhooks also lists every **user endpoint** with its owner and failures; staff can **Disable** one (the user can't switch it back on) and **Enable** it.

## Events

| Event | When | About (user endpoints) |
|---|---|---|
| `user.registered` | someone signed up | the new user |
| `user.verified` | someone verified their email | that user |
| `user.updated` | name or email changed | that user |
| `user.deleted` | an account is being deleted | staff only |
| `audit.recorded` | any audit-trail entry | staff only |
| `invitation.accepted` | an [invitation](/packages/invitations) was accepted | the new user |
| `team.member_joined` / `team.member_left` | [Teams](/packages/teams) membership changed | the member |
| `subscription.created` / `.updated` / `.cancelled` | a [Billing](/packages/billing) subscription changed in Stripe | the paying user |

Module events appear only while that module is on.

## The request

```http
POST /your/endpoint HTTP/1.1
Content-Type: application/json
User-Agent: acme-webhooks
Webhook-Id: 3f0c8d2e-6a7b-4c1d-9e2f-8a7b6c5d4e3f
Webhook-Timestamp: 1767258000
Webhook-Signature: v1=5d41402abc4b2a76b9719d911017c592...

{
  "id": "3f0c8d2e-6a7b-4c1d-9e2f-8a7b6c5d4e3f",
  "type": "user.registered",
  "created_at": "2026-01-01T09:00:00Z",
  "test": false,
  "data": {
    "user": { "id": 42, "name": "Ada Lovelace", "email": "ada@example.com", "email_verified_at": null, "created_at": "2026-01-01T09:00:00Z" }
  }
}
```

`id` is the same on every retry and redelivery — use it to ignore duplicates.

### Verifying the signature

The signature is the hex HMAC-SHA256 of `"{Webhook-Timestamp}.{raw body}"` with the endpoint's secret. Compare in constant time and reject old timestamps (5 minutes is common):

```php
$timestamp = (int) $request->header('Webhook-Timestamp');
$expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);
$given = substr((string) $request->header('Webhook-Signature'), 3); // after "v1="

abort_unless(hash_equals($expected, $given) && abs(time() - $timestamp) < 300, 401);
```

```js
import crypto from 'node:crypto';

const timestamp = req.get('Webhook-Timestamp');
const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
const given = (req.get('Webhook-Signature') || '').slice(3);

const ok = given.length === expected.length
  && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  && Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
```

## Delivery and retries

- Any **2xx** within **10 seconds** counts. Redirects are **not** followed.
- Otherwise it's tried again after **1 min, 5 min, 30 min, 2 h and 12 h** — 6 attempts in all.
- After **10 failed deliveries in a row** the endpoint is **disabled** and whoever created it is told (mail + in-app, a *Webhooks* notification preference). Switching it back on resets the count; failed deliveries can be redelivered from the log.
- Delivery logs are deleted after **30 days** (Settings → Webhooks, 0 keeps them) by `webhooks:prune`, nightly.

## Safety: private addresses

Endpoints must use **https**, and every address their host resolves to must be **public** — loopback, private networks, link-local (cloud metadata), carrier-grade NAT and reserved ranges, IPv4 and IPv6, are refused when saving **and** before each send, and the request goes to the address that was checked (no DNS switching in between). Credentials in the URL are refused.

For local development `WEBHOOKS_ALLOW_INSECURE=true` (on by default when `APP_ENV=local`) lets `http://` and local addresses through.

## Configuration

`config('webhooks')`, from the package's `config.php`:

| Key | `.env` | Default | |
|---|---|---|---|
| `self_service` | `WEBHOOKS_SELF_SERVICE` | `none` | who can add their own endpoints: `none`, `staff`, `roles`, `everyone` |
| `self_service_roles` | — | `[]` | role slugs, with `roles` |
| `max_per_user` | `WEBHOOKS_MAX_PER_USER` | `5` | endpoints per user |
| `retention_days` | `WEBHOOKS_RETENTION_DAYS` | `30` | delivery log retention; 0 keeps |
| `timeout` | `WEBHOOKS_TIMEOUT` | `10` | seconds to wait for an answer |
| `disable_after` | `WEBHOOKS_DISABLE_AFTER` | `10` | failed deliveries in a row before disabling |
| `allow_insecure` | `WEBHOOKS_ALLOW_INSECURE` | `true` when `APP_ENV=local` | http and private addresses |

## Sending your own events

Contribute to `webhooks.events` from a service provider (yours or your module's). It costs nothing while the Webhooks module is off:

```php
use Atrium\Core\Support\Modules\Module;

Module::contribute('webhooks.events', [[
    'key' => 'invoice.paid',
    'label' => 'An invoice was paid',
    'group' => 'Invoices',
    'listen' => InvoicePaid::class,                         // any Laravel event
    'payload' => fn (InvoicePaid $e) => [                   // "data" — choose fields; null skips
        'invoice' => ['id' => $e->invoice->id, 'total' => $e->invoice->total],
    ],
    'user' => fn (InvoicePaid $e) => $e->invoice->user,     // optional: lets users subscribe to their own
    'staff_only' => false,                                  // optional
    'sample' => fn () => ['invoice' => ['id' => 1, 'total' => 4900]], // for test sends
]]);
```

Never put secrets or hidden attributes in a payload.

## While support views as someone

With [Impersonation](/packages/impersonation) on, every action on the webhook pages is refused.
