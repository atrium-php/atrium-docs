# Theming

Two ways to change the look: **Backoffice → Settings** for brand basics without touching code, and the **portal CSS** in your project for everything else.

## Brand settings (no code)

Backoffice → Settings → General → *Brand* (`settings.edit`):

- **Brand name** — page titles, headers, emails, SMS and the 2FA issuer (default: `APP_NAME`).
- **Logo URL** and **favicon URL** — empty uses Atrium's logo (`resources/assets`) and no favicon.
- **Accent colour** — recolours the brand blue (buttons, links, accents) in every portal.
- **"Powered by Atrium"** credit — on by default, switch it off here.

An agency can ship Atrium under its own or a client's brand this way. In code, read them through `Atrium\Core\Support\Brand` (`@api`).

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

- map Flux's `zinc` grays onto `slate` (Flux uses `zinc` internally);
- define the brand **blue** and **red** ramps (`--color-blue-50` … `--color-blue-950`, same for red), used both as utilities (`bg-blue-500`) and as Flux's accent (`--color-accent`), with a `.dark` override;
- set the font to "Instrument Sans".

To rebrand in code, replace the hex values of the blue/red ramps. (The accent colour setting above overrides the middle of the blue ramp at runtime.)

## Edge design (square corners)

`edge-design.css` makes every corner square — buttons, cards, inputs, badges, avatars, checkboxes — in every portal. Flux components don't all use `rounded-*` classes (some, like the avatar, set their radius through a CSS variable), so the file overrides radius two ways:

1. by Flux's `data-flux-*` attributes (`[data-flux-card]`, `[data-flux-button]`, …);
2. by Tailwind `rounded-*` class names, for your own markup.

It also adds hard-offset shadows on primary/danger buttons, a brand-tinted avatar background, uppercase field labels and a slim scrollbar.

If a new Flux component still shows rounded corners, find the class or variable it uses (`vendor/livewire/flux*/stubs/resources/views/flux/{component}/`) and add a matching override.

**Turning it off:** delete `@import "./partials/edge-design.css";` from one portal's CSS file, or all of them.
