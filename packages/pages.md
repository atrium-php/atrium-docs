# Pages

| | |
|---|---|
| Package | `atrium-php/pages` — module `pages`, on once installed |
| Namespace | `Atrium\Pages\` |
| Depends on | core, `symfony/html-sanitizer`; uses [Languages](/packages/language) and [Media](/packages/media) when installed |
| Permissions | `pages.manage` — create, edit, publish, restore and delete pages. Admin has it. |
| Pages | Backoffice → **Pages**; each public page at `/{address}` on the landing site; `/sitemap.xml` |
| Config | `pages.revisions` (`PAGES_REVISIONS`, default 20) — also on Settings → Pages |
| Uninstall | backup **optional** — pages and their earlier versions come back on reinstall |

Public pages for the landing site — About, Terms, Privacy, Pricing copy — written in the Backoffice, per language, with search-engine and sharing tags.

**With the module off or uninstalled** page addresses return 404, the header / footer links and `/sitemap.xml` go away; nothing else changes.

## Install

```bash
php artisan module:install pages
```

Or Backoffice → Modules → *Available* → *Install*.

## Writing a page

Backoffice → Pages → **New page**:

- **Title** and **address** — the address follows the title until you change it (`privacy-policy` → `/privacy-policy`). Lowercase letters, numbers and dashes; one page per address and language.
- **Content** — rich text (headings, lists, quotes, tables, links, code). It is **cleaned on save**: scripts, event handlers, styles and unsafe links are removed; links get `rel="noopener noreferrer"`. *Show preview* displays it exactly as it will be stored.
- **Published** — off: a draft (404 to visitors). On: visible right away, or from **Visible from** (in your own timezone) — shown as *Scheduled* until then.
- **Width** — *Default*, *Full width*, or *Legal* (narrow, for long text).
- **Link from** — the landing **header** and/or **footer** menu, sorted by **Menu order**, then title.

The list (Backoffice → Pages) has search, a language filter, *Publish* / *Back to draft*, *View* and *Delete*, and an **Export** button with [Import / Export](/packages/import-export). With the [Command palette](/packages/command-palette), pages are searchable by title or address, and *New page* is an action.

### Earlier versions

Every save that changes the content keeps the previous version — the last **20** per page (Settings → Pages → *Revisions kept per page*, 1–100). **Restore** brings one back; the current content is kept as a version first. Publication is never part of a version: restoring doesn't publish or unpublish. Changes to pages are recorded in the [Activity](/packages/activity) log.

### Languages

With two or more active [languages](/packages/language), a page exists once per language. On the editor, **Languages** → **Add** makes a draft copy for another language (same address, unless that language already uses it), to translate and publish on its own. Visitors get the page in their language at the Languages module's addresses: `/fr/terms` (path mode) or `/terms?lang=fr`; the primary language has no marker.

## Search engines and sharing

Per page: **SEO title** (default: the title), **SEO description**, **Canonical URL** (only if the content lives elsewhere first), **Sharing image** — a URL, or *Choose from library* with [Media](/packages/media) installed — and **Hide from search engines** (`noindex`). The page then carries `description`, `canonical`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:locale`, `og:site_name`) and Twitter card tags.

**`/sitemap.xml`** lists the landing page and every published page not hidden from search engines, in every language, with its last change.

**`robots.txt`** stays your project's own static `public/robots.txt`. Point crawlers at the sitemap there:

```text
User-agent: *
Disallow:

Sitemap: https://example.com/sitemap.xml
```

## Addresses never clash

Page addresses are a route **fallback**: every other route — core's, any module's, your project's — is matched first. A page can never take over an existing address (a page with that address just isn't reachable), and in single-domain mode `/backoffice/…`, `/app/…` and the rest keep working.

## Adding links to the landing site

Other modules (or your project) can add header or footer links the same way Pages does:

```php
Module::contribute('landing.menus', [
    ['component' => 'invoices::landing-links', 'location' => 'footer'],  // a Blade component given :location
]);
```

## Customising

The Livewire pages are `atrium-pages::index`, `atrium-pages::edit` and `atrium-pages::show` (the public page) — replace one with `Platform::component()` like any Atrium page. The `Page` model is public API (`@api`).
