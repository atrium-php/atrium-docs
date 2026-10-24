# Announcements

| | |
|---|---|
| Package | `atrium-php/announcements` — module `announcements`, on once installed |
| Namespace | `Atrium\Announcements\` |
| Depends on | core |
| Permissions | `announcements.manage` (Admin has it; grantable like any other) |
| Pages | Backoffice → Announcements; *What's new* in the App, Backoffice and Account portals; banners above every page (landing too); one-time modals |
| Config | none |
| Uninstall | backup **database** — `announcements`, `announcement_dismissals` |

Messages from the Backoffice to the people using your app: a maintenance window, a new feature, a policy change. Three kinds:

| Type | Where | Gone when |
|---|---|---|
| **Banner** | Above every page of the portals you pick — App, Backoffice, Account, and the public **landing** page | it ends, is unpublished, or the person dismisses it (if dismissible) |
| **Modal** | Opens once, on the next page someone loads, in App / Backoffice / Account | the person closes it |
| **What's new** | Listed on the portal's *What's new* page; the sidebar link shows a **New** badge until the page is visited | it ends or is unpublished |

**With the module off or uninstalled nothing is shown** and nothing breaks.

## Install

```bash
php artisan module:install announcements
```

Or Backoffice → Modules → *Available* → *Install*.

## Writing an announcement

Backoffice → **Announcements** → *New announcement*:

- **Type** and, for banners, a **style** — info, success, warning, danger.
- **Title** (required), **message** (rich text: headings, bold / italic / underline, lists, quotes, links, code), and an optional **button** (text + link starting with `https://`, `http://` or `/`).
- **Show in** — which portals. Landing takes banners only (nobody is signed in there).
- **Only for roles** — empty means everyone. Someone sees it when they hold **any** of the roles. Landing visitors are guests, so only announcements for everyone appear there. Only Super Admins can target the Super Admin role.
- **Starts / Ends** — optional, in your own timezone. Empty start: as soon as it's published; empty end: until it's unpublished.
- **People can dismiss it** (banners) — off for notices that must stay up.
- **Published** — off saves a draft nobody sees.

The preview on the right shows exactly what people will see, in the language you're editing.

The list has *Draft*, *Scheduled*, *Live* and *Ended* tabs, and per row **Edit**, **Publish** / **Back to draft**, **Duplicate** (as a draft) and **Delete**.

### Languages

With the [Language](/packages/language) module on and more than one language active, title, message and button text get a tab per language. The primary language is required; any language left empty shows the primary one.

### Safe HTML

The message is cleaned when saved (`symfony/html-sanitizer`): formatting, lists, headings, quotes, code and links stay; scripts, event handlers, styles and images go. Links get `rel="noopener noreferrer"`.

## Who has seen what

- Dismissed banners, closed modals and viewed What's new entries are stored per user (`announcement_dismissals`), so they stay gone on every device.
- On the landing page a guest's dismissals go in a cookie (`announcements_dismissed`).
- While support is [viewing as someone](/packages/impersonation), dismissing only hides a banner for that page, modals don't open and What's new isn't marked seen — what the user has seen stays theirs. Saving, publishing, duplicating and deleting announcements are refused meanwhile.

## Caching

Published, not-yet-ended announcements are cached as one small set and refreshed whenever one is saved or deleted. Start and end times are checked against the clock on every request, so a scheduled announcement goes live on time without clearing any cache.

## For module authors

The module uses two core extension points you can use too:

- **`landing.banners`** — Livewire components under the landing header, for guests and signed-in visitors alike; each gets `:portal="landing"`:

  ```php
  Module::contribute('landing.banners', [['component' => 'promo::strip', 'order' => 10]]);
  ```

- **`badge`** on any nav item (`backoffice.nav`, `app.nav`, `account.nav`) — a closure returning the badge text or number; `null`, `''` or `0` shows none:

  ```php
  Module::contribute('app.nav', [[
      'label' => 'Inbox',
      'route' => 'app.inbox',
      'icon' => 'inbox',
      'badge' => fn (?User $user) => $user?->unreadMessages()->count(),
  ]]);
  ```

Banners above the signed-in portals use `shell.banners` — see [Impersonation](/packages/impersonation#for-module-authors).
