# Notifications

| | |
|---|---|
| Package | `atrium-php/notifications` — module `notifications`, on once installed |
| Namespace | `Atrium\Notifications\` |
| Depends on | core |
| Permissions | `notifications.manage` (Settings → Notifications), `notifications.broadcast` (**Super Admin only** until [handed over](/guide/roles-and-permissions) — Backoffice → Send notification) |
| Pages | the bell in the App and Backoffice headers; *Notifications* (`/notifications`) in both portals; the Notifications card on Account → Settings; Backoffice → Send notification |
| Config | `notifications` (below); prune days also on Backoffice → Settings → Notifications |
| Uninstall | backup **optional** |

In-app notifications on top of Laravel's own notification system. Atrium's notifications — and yours — stay ordinary `Illuminate\Notifications\Notification` classes; this module adds the `database` (in-app) channel, a bell and an inbox, lets every user choose which channels each kind of notification reaches them on, and lets the backoffice send messages to users.

**With the module off or uninstalled nothing breaks**: every notification still goes out on its other default channels — mail keeps working.

## Install

```bash
php artisan module:install notifications
```

Or Backoffice → Modules → *Available* → *Install*. Nothing to add to your user model (Atrium's `User` is already `Notifiable`). The module creates Laravel's standard `notifications` table — unless your project already has one from `php artisan make:notifications-table`.

## The bell and the inbox

- **Bell** in the App and Backoffice headers (not in Account): unread count, the latest ten, *Mark all read*, *View all*. Clicking a notification marks it read and opens its link.
- **Notifications** page (`/notifications` in each of those portals): *All* / *Unread*, a filter by group, mark read and delete — one at a time or a selection. Every query is scoped to the signed-in user; nobody can read or change another user's inbox.
- Counts update live when [broadcasting](#live-updates) is set up; otherwise the bell checks every 60 seconds (`NOTIFICATIONS_POLL_SECONDS`) while the tab is visible.

## Preferences

Account → Settings → **Notifications**: one row per kind of notification the user can receive, one switch per channel. Saving logs *"changed the notification preferences"* on the user's [My Activity](/packages/activity).

| Channel | Shown when |
|---|---|
| In-app | always (this module) |
| Email | always |
| SMS | an SMS provider is bound (see [SMS](#sms)) |
| Others (push…) | a channel package registers one |

**Mandatory** notifications are shown locked: they always go out on their defaults. In Atrium those are the security and account ones — email verification code, password reset code, confirming a new email address, phone verification code, account deletion scheduled / cancelled.

| Notification | Group | Default | Who sees it |
|---|---|---|---|
| Your data export is ready | Account & security | email + in-app | everyone |
| Messages from the team ([Send notification](#send-notification)) | General | in-app + email | everyone |
| A module restore you started finished | System | email + in-app | `modules.manage` |
| System health status changed ([Health](/packages/health)) | System | in-app | `health.view` |

No stored choice means the defaults — and going back to the defaults removes the stored row, so a later change to a default applies.

## Send notification

Backoffice → **Send notification** (`notifications.broadcast`): a title, a message, an optional link, and **who** — chosen users (search by name or email), roles, or everyone (deleted accounts never) — and **how**: in-app and/or email. Each recipient still gets it only on the channels they haven't switched off for *Messages from the team*.

Sending is queued and logged once in the `notifications` log (*"sent the message "…" to 120 recipients"*), whatever the audience size. The page lists what was sent, by whom and to how many.

This is a one-off message to people's inboxes. Banners and pop-ups shown inside the portals are a different feature.

## Live updates

With a broadcasting connection set up, every in-app notification is also broadcast on the recipient's private channel (`App.Models.User.{id}`) and the bell updates instantly. The module authorizes that channel and registers `/broadcasting/auth` (unless your app already did with `withBroadcasting()`).

With [Laravel Reverb](https://reverb.laravel.com), in a project that has this module:

```bash
composer require laravel/reverb
```

```sh
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=…
REVERB_APP_KEY=…
REVERB_APP_SECRET=…
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

Then `php artisan reverb:start` (keep it running, like the queue worker). `REVERB_HOST` / `REVERB_PORT` / `REVERB_SCHEME` must be what the browser reaches (behind a proxy: the public host, `443`, `https`).

No npm step: the module ships its own copy of [Laravel Echo](https://github.com/laravel/echo) 2.6.1 and [pusher-js](https://github.com/pusher/pusher-js) 8.6.0 (both MIT, licences alongside in `resources/dist`), served from `/notifications-assets/` and loaded only on pages with the bell, only while live updates are on — they leave with the module. The browser settings come from the broadcasting connection, so there are no `VITE_*` keys. A project that already sets up `window.Echo` itself keeps its own.

[Pusher](https://pusher.com) works the same way (`BROADCAST_CONNECTION=pusher`, `PUSHER_APP_KEY`, `PUSHER_APP_CLUSTER`…); Pusher-compatible servers (Soketi…) through the `reverb` or `pusher` connection's host and port.

`laravel/reverb` isn't required by the module or the skeleton on purpose: Reverb 1.12 needs Guzzle's psr7 2, and requiring it would downgrade Guzzle 8 → 7 in every project. Add it only where you want live updates (`composer require laravel/reverb -W` if Composer reports that conflict).

`BROADCAST_CONNECTION=log` or `null` (a new project's default) = no live updates; the bell polls. Shared hosting needs nothing.

## SMS

Core's `sms` channel sends a notification's `toSms()` text through `Atrium\Core\Contracts\SmsService`. Out of the box that's `LogSmsService`: messages go to the log, nothing is sent, and SMS isn't offered in preferences. Bind a real gateway to send — see [Core → Services you can swap](/packages/core#services-you-can-swap).

## Sending your own notifications

Write a normal Laravel notification, implement `Atrium\Core\Contracts\NotificationType` with the `RespectsPreferences` trait, and list it — it then appears in everyone's preferences and respects them. It works the same with this module off (minus in-app).

```php
use Atrium\Core\Contracts\NotificationType;
use Atrium\Core\Notifications\Concerns\RespectsPreferences;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoicePaid extends Notification implements NotificationType
{
    use RespectsPreferences;   // via(): the user's choice

    public function __construct(public Invoice $invoice) {}

    public static function preferenceKey(): string { return 'invoices.paid'; }
    public static function preferenceLabel(): string { return __('An invoice was paid'); }
    public static function preferenceGroup(): string { return __('Billing'); }
    public static function defaultChannels(): array { return ['database', 'mail']; }
    // Optional: mandatory(): bool (false), preferencePermission(): ?string (null = everyone)

    public function toMail(object $notifiable): MailMessage { /* … */ }

    // In-app: title, body, url, icon (a Flux icon name).
    public function toArray(object $notifiable): array
    {
        return ['title' => __('Invoice :number paid', ['number' => $this->invoice->number]), 'body' => '', 'url' => route('app.invoices.show', $this->invoice), 'icon' => 'banknotes'];
    }
}
```

```php
// In your module's bootModule() (or a service provider):
Module::contribute('notifications.types', [InvoicePaid::class]);

$user->notify(new InvoicePaid($invoice));
```

Which channels a notification *can* go on follows from its methods: `toMail()` → email, `toArray()` / `toDatabase()` → in-app, `toSms()` → SMS. On-demand notifications (`Notification::route('mail', …)`) go exactly where they're routed.

A channel package (push, Slack, WhatsApp…) registers its driver with `Notification::extend()` and lists it with `Module::contribute('notifications.channels', [['key' => 'push', 'label' => 'Push', 'order' => 40, 'selectable' => fn () => …]])` — it then shows up as a column in preferences for notifications that have `toPush()`.

## Configuration

Backoffice → Settings → **Notifications** (`notifications.manage`) sets how long notifications are kept. Create `config/notifications.php` to change the defaults:

| Key | |
|---|---|
| `prune.read_days` / `NOTIFICATIONS_PRUNE_READ_DAYS` | Read notifications older than this are deleted (90; 0 = keep) |
| `prune.all_days` / `NOTIFICATIONS_PRUNE_ALL_DAYS` | Every notification older than this is deleted, unread too (365; 0 = keep) |
| `poll_seconds` / `NOTIFICATIONS_POLL_SECONDS` | How often the bell checks without live updates (60) |

`notifications:prune` runs daily at 03:30. The Send notification history is kept.

## Deleting

| Action | Effect |
|---|---|
| Delete a notification / prune | Gone from the inbox |
| Account deletion | The user's notifications and preferences are deleted |
| Module off | Nothing is deleted; no bell, no pages; mail still goes out |
| Uninstall | Backup optional; drops `notifications`, `notification_preferences`, `notification_broadcasts` and the settings |

## Tables

- `notifications` — Laravel's: `type` (class), `notifiable_type`/`id`, `data` (title, body, url, icon), `read_at`.
- `notification_preferences` — `user_id`, `type` (preference key), `channels` (json).
- `notification_broadcasts` — messages sent from the backoffice: `title`, `body`, `url`, `channels`, `audience` (`users` / `roles` / `everyone`) + `audience_ids`, `recipients`, `sent_by`, `sent_at`.
