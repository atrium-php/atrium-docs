# Cookie consent

| | |
|---|---|
| Package | `atrium-php/consent` — module `consent`, on once installed |
| Namespace | `Atrium\Consent\` |
| Depends on | core |
| Permissions | `consent.manage` (Admin has it) |
| Pages | a banner on the landing page and every portal; Account → Privacy; Backoffice → Legal documents; Settings → Cookie consent |
| Config | `config/consent.php`: `categories`, `cookie`, `cookie_days`, `policy_version` (`CONSENT_POLICY_VERSION`), `reaccept`, `banner_text`, `retention_days` (`CONSENT_RETENTION_DAYS`) |
| Uninstall | backup **database** — `consents`, `legal_documents`, `legal_acceptances` (legal evidence; backups are required). Waits while a document requires acceptance or the log holds choices from the last `retention_days` |

A consent banner with **Accept all**, **Reject non-essential** and **Customize**. Necessary cookies are always on; `preferences`, `analytics` and `marketing` are the visitor's choice. Nothing gated loads until a choice is recorded, and a broken or missing cookie counts as no consent.

## Install

```bash
php artisan module:install consent
```

Or Backoffice → Modules → *Available* → *Install*.

## The proof log

Every choice adds a row to `consents`: the signed-in user (if any), an anonymous id kept in the cookie, the categories accepted, the policy version, the address with its last part dropped, and the browser. Rows are never changed.

## Gating scripts

From a module or your app:

```php
Module::contribute('consent.scripts', [[
    'category' => 'analytics',
    'key' => 'plausible',
    'html' => '<script defer data-domain="example.com" src="https://plausible.io/js/script.js"></script>',
]]);
```

The script is printed only once the visitor accepts that category. In Blade:

```blade
@consent('analytics')
    <script>/* only after consent */</script>
@endconsent
```

With the module off the directive renders nothing, so gated code never leaks.

## Asking again

Set `CONSENT_POLICY_VERSION` to a new value (for example `2`) after changing a policy. Choices made under an older version no longer count and the banner returns.

## Account → Privacy

Signed-in users see and change their choice, and the last choices they made. Data download and account deletion stay in the account settings.

## Terms and Privacy versions

Backoffice → **Legal documents** (`consent.manage`): publish a version of the **Terms** or the **Privacy policy** with its title, address (a page of yours, such as one from the Pages module), an effective date and whether signed-in users must accept it again. Versions are never edited or deleted: they are the record of what people accepted. The newest version already in effect is the one in force.

- **Sign-up:** while any version is in force, the registration form asks for an "I accept…" tick (linking each document) and records the versions in force for the new account.
- **Re-accept:** a signed-in user who hasn't accepted the version in force (marked *re-accept*) is sent to **Account → Privacy → Accept** before any page. Livewire calls, sign-in, sign-out and anyone being viewed by support pass. Verify your email first: the accept page comes after.
- **Switch:** Settings → Cookie consent → *Ask for acceptance of new Terms and Privacy versions*. Off: published versions only inform.
- **Proof:** every acceptance is stored with the version, the source (registration or re-accept) and a shortened address, and listed on the user's Privacy page.

Other modules can add their own ticks to the sign-up form with the core `register.checks` point.

## Settings

Settings → **Cookie consent**: the categories visitors can choose from, your own banner wording (empty uses the built-in text, which Translations can translate) and the re-accept switch.

## Uninstalling

Uninstall waits while any document still requires acceptance, or while the log holds choices younger than `retention_days` (three years by default; `0` turns the wait off). Backups of the module's tables are required.
