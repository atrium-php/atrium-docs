# Email templates

| | |
|---|---|
| Package | `atrium-php/mail-templates` — module `mail-templates`, on once installed |
| Namespace | `Atrium\MailTemplates\` |
| Depends on | core, `symfony/html-sanitizer` |
| Permissions | `mail-templates.manage` — Backoffice → Email templates and its Design page (Admin has it) |
| Pages | Backoffice → Email templates (list, one page per mail), Backoffice → Email templates → Design |
| Config | none |
| Uninstall | backup **optional** — templates and the design are restored |

Every mail Atrium sends — core's and every installed module's (Security, Teams, Invitations, Webhooks…) — can be reworded per language and restyled from the Backoffice. Modules ship their mails with the basic brand style; this module lets the developer or the client change both the words and the look.

**With the module off or uninstalled** each mail goes out as built in, in the brand's basic style (logo or name, accent colour, footer line — Settings → General → Brand).

## Install

```bash
php artisan module:install mail-templates
```

Or Backoffice → Modules → *Available* → *Install*.

## Editing a mail

Backoffice → **Email templates** lists every mail by group (*Account & security*, *Teams*, *System*…), marked *Built in* or *Edited* with the languages that have their own wording. Opening one shows:

- **Subject**, **Message** (rich text: headings, bold / italic / underline, lists, quotes, code, links) and **Button text** for mails with a button.
- **Language tabs** when the [Language](/packages/language) module has more than one active language. A language without its own wording sends the built-in mail (translated as usual); each tab starts from it.
- **Variables** — chips that insert `{{ name }}` at the cursor. Each mail lists its own (`{{ code }}`, `{{ team }}`, `{{ date }}`…); `{{ app }}` (the brand name) is always there. They work in the subject and button text too. A name the mail doesn't have is flagged and left empty. `{{ button }}` places the button; without it the button goes at the end.
- **Preview** with sample values, as it will look in an inbox, and **Send test to me** (the unsaved wording, subject prefixed *[Test]*; 5 a minute).
- **Reset to built-in** deletes the wording for that language.

Each mail goes out in its recipient's language (their account language, while it's an active language).

**Safe by design.** Variables are filled by plain text replacement — never Blade or PHP — and their values are escaped, so a template can't run code or inject markup. The message is cleaned on save down to tags every mail client renders; styles, scripts and images are removed. The **button's link always comes from the mail itself**: a template changes its text or drops it, never where it points (no turning a password reset into a phishing link).

Edits, resets and design changes are recorded in the [Activity](/packages/activity) log when that module is on.

## Design

Backoffice → Email templates → **Design** sets the look every mail shares, with a live preview of any mail and a test send:

| Setting | Default |
|---|---|
| Colours: background, message card, text, headings, buttons and links, button text, footer text | light grey / white / zinc, accent = the brand colour |
| Font | System — or Helvetica / Arial, Georgia, Verdana, Trebuchet MS |
| Button corners | 6 px (0–24) |
| On top | Brand name — or the logo, at a height of 16–120 px |

Only settings every mail client shows the same way are offered: mails stay table-based with inlined CSS, and web fonts, flex or grid layouts are left out because Gmail, Outlook and Apple Mail don't agree on them. **The logo** comes from Settings → General → Brand and must be a PNG or JPG at a public URL — SVG and the default logo don't show in Gmail or Outlook, so the brand name is used instead. The **footer line** is the Brand setting *Email footer* (default *© year brand. All rights reserved.*).

## For developers

- Your own mails can be edited here too: implement `TemplatedMail` and list them on `mail.templates` — see [Architecture → Mails](https://github.com/atrium-php/atrium/blob/main/docs/contributing/03-architecture.md).
- To change the layout's HTML itself, publish Laravel's mail components (`php artisan vendor:publish --tag=laravel-mail`) — files in `resources/views/vendor/mail` win over Atrium's. A project theme set in `mail.markdown.theme` replaces the design settings.

## Uninstalling

```bash
php artisan module:uninstall mail-templates
```

Owned data: the `mail_templates` table and the `mail_design` setting. Backup **optional**; restoring brings both back. Mails go out as built in from then on.
