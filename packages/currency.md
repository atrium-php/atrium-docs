# Currency

| | |
|---|---|
| Package | `atrium-php/currency` — module `currency`, on once installed |
| Namespace | `Atrium\Currency\` |
| Depends on | core |
| Permissions | `currencies.view`, `currencies.manage` (Super-Admin-only by default) |
| Pages | Backoffice → Currencies (`/currencies`); Backoffice → Settings → Currencies |
| Schedule | exchange rates daily at 01:00 |
| Uninstall | backup optional |

Money handling (`Money`, `MoneyCast`) is in core; currencies, rates and their pages are this module. Everything stays out of the way until you enable a second currency.

## Install

```bash
php artisan module:install currency
```

Or Backoffice → Modules → *Available* → *Install*. It seeds the currencies with USD enabled and primary. No `.env` keys.

Uninstalling offers a backup (policy **optional**). Without the module, `Money` and `MoneyCast` keep working with plain formatting and no conversion.

## Money is always an integer

Every amount is an integer in the currency's smallest unit — cents, paisa, halala — never a float. `Atrium\Core\Support\Money` pairs that integer with its currency code:

```php
use Atrium\Core\Support\Money;

$price = new Money(3000, 'USD');   // $30.00
$price->format();                  // "$30.00"
$price->convertTo('EUR');          // a new Money, at the current rate
```

`Atrium\Core\Casts\MoneyCast` puts it on any integer column of your models:

```php
protected function casts(): array
{
    return ['price' => MoneyCast::class.':currency'];
}
```

`currency` is a sibling column on the same row holding **that record's own** currency code. Once a record (an order, an invoice) is saved in a currency it keeps it: rate updates never rewrite stored amounts. Leave the argument out to always use the primary currency (fine for values that are never a historical price).

`Money` and `MoneyCast` are `@api` and work with the Currency module off: formatting then falls back to `"USD 30.00"` (code, two decimals) and conversion returns the amount unchanged.

## Currencies

The module seeds 44 ISO 4217 currencies — code, name, symbol, `decimal_digits` (2 for most, 0 for JPY/KRW/VND, 3 for BHD/KWD/OMR/JOD), plus an exchange rate. Only **USD** ships enabled and primary.

Only **enabled** currencies are used anywhere else: `Money` formatting and conversion, the exchange-rate refresh and the primary-currency picker. A disabled currency formats like an unknown code (the plain integer) and converts nothing.

- **Backoffice → Currencies** (`currencies.view`) — every currency, its formatting and its rate against the primary currency. Filter All · Enabled · Disabled and search by code or name.
  With `currencies.manage`, each row's **⋯** menu has **Enable** / **Disable** and **Make primary** (enabled rows only), and ticking rows shows **Enable selected** / **Disable selected**.
  The primary currency can't be disabled — make another one primary first — so at least one currency is always enabled. A bulk disable skips it.
- **Backoffice → Settings → Currencies** (`currencies.manage`) — the **Primary currency** among the enabled ones, and **Refresh rates** to update rates immediately.

Making a currency primary recalculates the stored rates against it (each divided by its old rate), so conversions stay right before the next refresh. Every change lands in the [activity log](/packages/activity) when that module is on.

`currencies.manage` is Super-Admin-only by default: Admin doesn't get it. Grant it to your own role from Roles → **Manage Permissions**.

## Exchange rates

Rates come from [Frankfurter](https://frankfurter.dev) (free, ECB-based, no API key), relative to the primary currency, for enabled currencies only. A scheduled job refreshes them daily at 01:00 — keep Laravel's scheduler running.

Conversion uses the primary currency as the pivot and is for display and quoting only; it never changes amounts stored on other models.

## Formatting and conversion in your code

Use the contract, not the module's classes:

```php
use Atrium\Core\Contracts\Currencies;

$currencies = app(Currencies::class);
$currencies->format(3000, 'EUR');            // "€30.00"
$currencies->convert(3000, 'USD', 'EUR');    // minor units
$currencies->primaryCode();                  // "USD"
```

Formatting is `{symbol}{amount}` with the currency's own decimal digits (`"{code} "` when there's no symbol); it doesn't need `ext-intl`.

## Your own rate source or formatting

Bind your own implementation of `Atrium\Core\Contracts\Currencies` in a service provider — Atrium, its modules and `Money` all resolve the contract:

```php
$this->app->bind(Currencies::class, MyCurrencies::class);
```
