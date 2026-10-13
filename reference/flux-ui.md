# Flux UI Pro

Atrium's interface uses [Flux UI Pro](https://fluxui.dev/pricing) components (charts, sortable and paginated tables, toasts, the sidebar, …). Every Atrium project therefore needs **its own Flux Pro licence**: Flux Pro is licensed per project and can't be redistributed.

So Atrium's packages depend only on the free `livewire/flux`, and the project brings Pro: the skeleton's `composer.json` requires `livewire/flux-pro` from Flux's private Composer repository.

## Credentials

Give Composer your credentials once, before `composer create-project` or `composer install`:

```bash
composer config --global http-basic.composer.fluxui.dev "your-license-email" "your-license-key"
```

Or keep them per project in `auth.json`, which is git-ignored — never commit it. Without credentials, `create-project` asks for them.

In CI, store `FLUX_USERNAME` and `FLUX_LICENSE_KEY` as secrets and run `composer config http-basic.composer.fluxui.dev "$FLUX_USERNAME" "$FLUX_LICENSE_KEY"` before `composer install`. Atrium's own workflows do exactly this.

## Module packages

A module package (made with `atrium:make-package`) needs only Atrium, so its own `composer install` and CI need no Flux licence. The project it's installed in brings Flux Pro.

## Paid modules

Sellers of Atrium modules inherit the same rule: each client needs their own Flux Pro licence for the project the module runs in. See [Build (and sell) a module](/guide/build-a-module).
