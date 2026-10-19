---
layout: home

hero:
  name: Atrium
  text: Multi-portal Laravel apps that keep upgrading
  tagline: Landing, auth, account, app and backoffice portals on their own subdomains — installed as Composer packages, so every project upgrades with composer update.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Customising without forking
      link: /guide/customising

features:
  - title: Portals out of the box
    details: Auth (with 2FA and OTP), account self-service, an app portal and a staff backoffice, each on its own subdomain — or all on one host with APP_SINGLE_DOMAIN=true.
  - title: Upgradable, not forked
    details: Atrium lives in vendor/atrium-php/*. Change it through extension points; composer update + atrium:upgrade stays safe.
  - title: Modules
    details: Activity log, API, backups, billing, currencies, languages, maintenance and media — install the ones you need from the backoffice, uninstall with a backup, restore later. Write your own the same way.
  - title: Build and sell modules
    details: atrium:make-package scaffolds a standalone module package, with optional licensing hooks for paid modules.
---
