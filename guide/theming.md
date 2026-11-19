# Theming

Two ways to change the look: **Backoffice → Settings** for brand basics without touching code, and the **portal CSS** in your project for everything else.

## Brand settings (no code)

Backoffice → Settings → General → *Brand* (`settings.edit`):

- **Brand name** — page titles, headers, emails, SMS and the 2FA issuer (default: `APP_NAME`).
- **Logo URL** and **favicon URL** — empty uses Atrium's logo (`resources/assets`) and no favicon. With the [Media](/packages/media) module, **Choose from library** fills in an image's permanent link (it keeps working after the image is edited; save the settings to use it).
- **"Powered by Atrium"** credit — on by default, switch it off here.

An agency can ship Atrium under its own or a client's brand this way. In code, read them through `Atrium\Core\Support\Brand` (`@api`).

## Theme colours (each user's own)

Every signed-in user picks their own colours under **Account → Settings → Appearance**, from round swatches: one of Flux UI's accent colours (blue is Atrium's own blue, gray is no colour) and one of its base grays (slate, gray, zinc, neutral, stone). The pick is saved to their user record (`theme_accent`, `theme_base`) as soon as they click, and the page recolours at once. Signed-out pages, and users who never picked, get Atrium blue on slate. Only Flux's colours can be picked: there is no free hex colour, no `.env` key and no app-wide override.

They use Flux UI's own theming. The accent sets Flux's `--color-accent`, `--color-accent-content` and `--color-accent-foreground` (primary buttons, links, switches, focus rings, checked controls) with the shades of Flux's `<flux:accent>`, light and dark, so everything Flux draws in the accent follows it. The base gray re-points Flux's `zinc` scale, which every Flux component draws with. The `brand-head` component puts `data-accent` and `data-base` on `<html>`, and `theme.css` holds one rule per colour.

Light / dark / system stays Flux's own per-browser choice: the theme switcher in each portal's header, and the *Mode* control on the same card.

In code: `Atrium\Core\Support\Theme::accent($user)` and `base($user)` (`@api`; the signed-in user when left out).

## The portal CSS

Each portal has a Tailwind v4 CSS entry in your project — `resources/css/{app,account,auth,backoffice,landing,errors}.css`, plus one per portal you add with [`make:subdomain`](/guide/make-subdomain-command). They all import the same two files:

```
resources/css/theme.css                 brand colours and font
resources/css/partials/edge-design.css  the square "edge design"
```

So a change there applies to every portal at once. Run `npm run build` (or `npm run dev`) afterwards.

These files are **copies of Atrium's** that a new project starts with. Edit them freely: `atrium-overrides.json` remembers each one, `atrium:upgrade` refreshes the ones you never touched, and `atrium:overrides` lists the ones you edited whose original Atrium has since changed (see [Customising](/guide/customising#your-copies-of-atrium-files)).

Each portal's CSS also scans Atrium's views in `vendor/atrium-php/*` (the `@source` lines), so classes used by Atrium's pages are always built — keep those lines when you edit.

## Brand colours

`theme.css` uses Tailwind's `@theme` block to:

- define the brand **blue** and **red** ramps (`--color-blue-50` … `--color-blue-950`, same for red), used both as utilities (`bg-blue-500`) and as Flux's default accent (`--color-accent`), with a `.dark` override;
- set the font to "Instrument Sans";
- map each accent and base gray users can pick onto Flux's tokens (the `[data-accent]` and `[data-base]` rules at the end).

To rebrand in code, replace the hex values of the blue/red ramps, or change the shades in a `[data-accent]` rule.

## Edge design (square corners)

`edge-design.css` makes every corner square — buttons, cards, inputs, badges, avatars, checkboxes — in every portal. Flux components don't all use `rounded-*` classes (some, like the avatar, set their radius through a CSS variable), so the file overrides radius two ways:

1. by Flux's `data-flux-*` attributes (`[data-flux-card]`, `[data-flux-button]`, …);
2. by Tailwind `rounded-*` class names, for your own markup.

It also adds hard-offset shadows on primary/danger buttons, a brand-tinted avatar background, uppercase field labels and a slim scrollbar.

If a new Flux component still shows rounded corners, find the class or variable it uses (`vendor/livewire/flux*/stubs/resources/views/flux/{component}/`) and add a matching override.

**Turning it off:** delete `@import "./partials/edge-design.css";` from one portal's CSS file, or all of them.
