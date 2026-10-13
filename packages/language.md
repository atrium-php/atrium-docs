# Language

| | |
|---|---|
| Package | `atrium-php/language` — module `language`, on by default (`MODULE_LANGUAGE`) |
| Namespace | `Atrium\Language\` |
| Depends on | core, spatie/laravel-translation-loader, mcamara/laravel-localization |
| Permissions | `languages.view/create/edit/delete` (Super Admin only), `translations.landing`, `translations.portal`, `translations.common` (Super Admin only) |
| Pages | Backoffice → Languages (`/languages`), Translations (`/translations/{scope?}`); URL mode and Google Translate key on Settings |
| API | `languages:read`, `languages:write` endpoints when the [API module](/packages/api) is on |
| Config | `translation-loader` (spatie's) |

Localization and RTL: multiple languages managed from the database — no lang files to edit to add a language, and invisible until a second language is active. (Timezones are [core](/packages/core#timezones).)

## Languages (Backoffice → Languages)

Each language has a code, name, native name, direction (`ltr`/`rtl`), active flag, primary flag and display order. The page needs `languages.*` permissions, which are **Super-Admin-only** (see [Roles & Permissions](/guide/roles-and-permissions#super-admin-only-permissions)).

- Exactly one language is primary; making another primary demotes the old one.
- The primary language can't be deactivated or deleted until another is primary.
- The arrows set the order in the language switcher.

With fewer than two active languages, the switcher is hidden everywhere and the locale is the single active (or primary) language.

## RTL

Direction comes from the language row, not a hard-coded list, and sets `<html dir="…">` in every portal layout.

The UI uses Tailwind's logical properties (`ps-`/`pe-`, `ms-`/`me-`, `border-s`/`border-e`, `text-start`/`text-end`) instead of physical ones, so flipping `dir` flips the layout with no `rtl:` variants. The few truly directional icons (back arrows, sign-out, "continue") use `rtl:rotate-180`.

Follow the same rule in your own views: physical utilities (`pl-`, `mr-`, `text-left`) don't flip under RTL.

## Which language a request gets

### `app`, `account`, `backoffice`

**The signed-in user's saved preference only** — Account → Settings → Preferred language (`users.locale`). Neither `?lang=` nor a `/xx` path segment does anything on these portals, and they have no switcher.

### `landing`, `auth`

Guest-facing, so the URL decides. In order:

1. **The URL** — `?lang=xx` or `/xx`, whichever [URL mode](#url-mode) is active.
2. **The signed-in user's preference** — as a default when the URL says nothing.
3. **The session** — sticky once resolved.
4. **The browser's `Accept-Language`**.
5. **The primary language**.

`Carbon`'s locale follows the request's language, so `translatedFormat()` and `diffForHumans()` produce translated month names and "2 days ago" for every locale Carbon ships (dates stay Gregorian).

## URL mode

Backoffice → Settings (`languages.edit`), one of:

| Mode | Shape | Notes |
|---|---|---|
| **Path prefix** (default) | `example.com/` (primary) · `example.com/ar` | Landing and auth routes get the locale prefix; `route()` builds prefixed links automatically. The primary language never gets a prefix. |
| **Query string** | `example.com/?lang=ar` | No prefixed routes at all — `/ar` is a 404. |

Only the active mode works. The switcher builds links for whichever mode is on.

## The language switcher

`<x-language::locale-switcher />` — hides itself under two active languages. Atrium includes it on landing (header) and auth (corner), deliberately not on app/account/backoffice. Add it to your own guest-facing pages, wrapped in `@module('language') ... @endmodule`.

In your code, use the contract rather than the module's classes:

```php
use Atrium\Core\Contracts\Languages;

app(Languages::class)->isMultiLanguageEnabled();
app(Languages::class)->activeCodes();       // ['en', 'ar']
app(Languages::class)->currentDirection();  // 'rtl'
```

## Translations (Backoffice → Translations) {#translations}

Every `__('...')` string and validation message can get a database translation, with no change to your views: the database wins when a row exists, otherwise the normal string is used. You only add rows for what you translate. (Backed by `spatie/laravel-translation-loader`.)

Each row has a **scope**, used only by the backoffice page and its permissions:

| Scope | Page | Permission | |
|---|---|---|---|
| Landing | `/translations` | `translations.landing` | Admin can have it |
| Portal | `/translations/portal` | `translations.portal` | Admin can have it — app/account/backoffice text |
| Common | `/translations/common` | `translations.common` | **Super-Admin-only** — words used everywhere |

The Translations menu item appears once two languages are active.

### Editing

One language at a time: pick a language at the top ("Editing language: English · العربية · …") and every row shows and saves that language. Add a row by hand with **Text** (a `__()` string) or **Validation** (a validator message such as `required` or `custom.email.required`) and the key exactly as in code.

**Placeholders are protected:** every `:token` in a key (`:name`, `:count`) is shown as a badge, and saving a translation that drops one is refused.

**English is always filled:** the key is the English text, so new rows get it as their English value and never show up as "missing English".

### Analytics and sync

Cards above the list: **Total strings**, **Missing translations** (rows missing an active language), **Active languages**, **Pending sync** — `__('...')` calls in the code with no row yet.

**Sync now** scans for literal `__('...')` calls in your project (`app/`, `resources/views/`) and in Atrium core, and creates the missing rows with their scope from the folder they're in:

- pages and layouts of landing and auth → **landing**
- pages and layouts of app, account, backoffice → **portal**
- everything else → **common**

It never overwrites or deletes; an Admin without `translations.common` syncs only landing and portal strings. Dynamic keys (`__($variable)`) can't be found by a scan.

### Google Translate (optional)

With a Google Translate API key set (Backoffice → Settings, stored encrypted, never shown again) and a language other than English selected, **Translate with Google** fills the blank rows of the current scope in one batch. Each result passes the same placeholder check — a translation that lost a `:token` is skipped. Existing translations are never overwritten, and nothing runs unless an admin clicks.

Get a key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) after enabling the Cloud Translation API.

## API endpoints

With the [API module](/packages/api) on, the Language module adds endpoints under `/v1` — the complete example of a module API (resource, form requests, pagination):

| Method | Path | Ability |
|---|---|---|
| `GET` | `/v1/languages`, `/v1/languages/{code}` | `languages:read` |
| `POST` | `/v1/languages` | `languages:write` |
| `PATCH`, `DELETE` | `/v1/languages/{code}` | `languages:write` |

The token's user also needs the matching `languages.*` permission — a token never grants more than its user has.
