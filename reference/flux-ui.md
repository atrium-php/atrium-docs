# Flux UI Pro

Atrium's interface is built with [Flux UI Pro](https://fluxui.dev/pricing) components (charts, sortable and paginated tables, toasts, the sidebar, …). Every Atrium project therefore needs **its own Flux Pro licence**. Flux Pro is licensed per project and can't be redistributed, so Atrium's packages require `livewire/flux-pro` and don't bundle it.

## Credentials

`livewire/flux-pro` installs from Flux's private Composer repository. Give Composer your credentials once, before `composer create-project` or `composer install`:

```bash
composer config --global http-basic.composer.fluxui.dev "your-license-email" "your-license-key"
```

Or keep them per project in `auth.json`, which is git-ignored. Never commit it.

In CI, store `FLUX_USERNAME` and `FLUX_LICENSE_KEY` as secrets and run `composer config http-basic.composer.fluxui.dev "$FLUX_USERNAME" "$FLUX_LICENSE_KEY"` before `composer install`. Atrium's own workflows do exactly this.

## Paid modules

Sellers of Atrium modules inherit the same rule: each of their clients needs their own Flux Pro licence for the project the module is installed in. See [Build and sell a module](/guide/build-a-module).
