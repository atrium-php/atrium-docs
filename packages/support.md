# Support

| | |
|---|---|
| Package | `atrium-php/support` — module `support`, on once installed |
| Namespace | `Atrium\Support\` |
| Depends on | core |
| Permissions | `support.view` (read the inbox), `support.reply` (reply, notes, status, priority, assignee), `support.manage` (canned replies). Admin has all three |
| Pages | `/contact` (landing); `/support/{token}` (the emailed link); Account → Support; Backoffice → Support and Canned replies; Settings → Support (`support.manage`) |
| Config | `support` — `contact_limit` (default 5 per hour, per address and IP), `captcha` (`SUPPORT_CAPTCHA`, `SUPPORT_CAPTCHA_SITE_KEY`, `SUPPORT_CAPTCHA_SECRET`), `sla_hours` (`SUPPORT_SLA_HOURS`, default 24), `attachments` (file count, size in KB, allowed types) |
| Uninstall | backup optional — `tickets`, `ticket_messages`, `canned_replies` |

A contact form and in-app help that feed one Backoffice inbox. Staff reply, assign tickets, keep internal notes and reuse canned replies; the requester gets email.

## Install

```bash
php artisan module:install support
```

Or Backoffice → Modules → *Available* → *Install*. Nothing to add to your user model.

## How a request travels

1. Someone sends the **contact form** (`/contact`) or, signed in, **Account → Support**. A ticket gets a number (`T-00042`) and they get a confirmation email.
2. It lands in **Backoffice → Support** as *Open*. Staff open it, assign it, set a priority and answer. Each public reply is emailed to the requester and moves an *Open* ticket to *Pending*.
3. The requester answers from Account, or — with no account — from the link in their email. Writing again reopens the ticket. They can close it themselves; staff can also mark it *Resolved* or *Closed*.

Guests' links open only their own ticket. The link's token is stored hashed; after a staff reply the guest gets a fresh link and the old one stops working.

## Internal notes

Tick **Internal note** in the reply box to leave a note only staff see: it is never shown to the requester (not in Account, not on the guest page) and never emailed.

## Canned replies

Backoffice → Support → **Canned replies** (`support.manage`). In a ticket, *Canned reply* inserts the text into the reply box to edit before sending.

## Attachments

With the [Media](/packages/media) module installed and on, the contact form, Account → Support and the reply boxes take files (up to 5, 5 MB each; images, PDF or text — `support.attachments` in `config/support.php`). Without Media the file pickers don't appear and nothing is kept.

Files are **private**: they never show in the Media library and are opened only through short-lived signed links, shown on pages that already checked you may read that ticket. Files on an internal note are staff-only like the note.

## Spam protection

The contact form has a hidden honeypot field (bots that fill it get a normal-looking "sent" and no ticket) and a limit per address and IP. Override `support.contact_limit` in your project's config to change the limit.

### Captcha

Optionally, visitors who are not signed in must also pass a [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) or [hCaptcha](https://docs.hcaptcha.com/) check before the form sends. Signed-in people never see it, and Account → Support never asks.

Create a site with your provider for your domain, then either fill in **Settings → Support** (`support.manage`) — provider, site key and secret key — or set them in `.env`:

```dotenv
SUPPORT_CAPTCHA=turnstile        # none, turnstile or hcaptcha
SUPPORT_CAPTCHA_SITE_KEY=0x4AAAAAAA...
SUPPORT_CAPTCHA_SECRET=0x4AAAAAAA...
```

The settings win over `.env`; the secret key is stored encrypted. The captcha is on only when a provider **and both keys** are set. Each token is checked once with the provider from your server; a token the provider refuses, or a provider that cannot be reached within 5 seconds, stops the form with *Please complete the check that you are not a robot.* and the widget asks again.

The widget loads its script from the provider (`challenges.cloudflare.com` or `js.hcaptcha.com`) on `/contact` only. If your site sends a Content-Security-Policy, allow that host for scripts and frames. For automated tests, both providers publish test keys that always pass.

## Mail

Staff with `support.reply` are told of each new request by email and in the app (the *Support* notification preference turns either off). The requester gets two emails. All three are editable per language with [Email templates](/packages/mail-templates): *Support request received*, *Support reply* and *New support request (to staff)*.

## Not included yet

Replying by email.
