# Currency & Money

Money handling is in core; currencies, rates and their backoffice pages are the **Currency module** (`atrium-php/currency`). Everything stays out of the way until you activate a second currency.

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

The module seeds 44 ISO 4217 currencies — code, name, symbol, `decimal_digits` (2 for most, 0 for JPY/KRW/VND, 3 for BHD/KWD/OMR/JOD), plus an exchange rate. Only **USD** ships active and primary.

- **Backoffice → Currencies** (`currencies.view`) — read-only reference: every currency, its formatting and its rate against the primary currency.
- **Backoffice → Settings** (`settings.edit`) — which currencies are active and which is primary: pick one from the list and **Add**, remove with the tag's ×. The primary can't be removed until another is primary. Nothing is saved until the page's **Save**.
- **Refresh rates** on the Settings page updates rates immediately.

## Exchange rates

Rates come from [Frankfurter](https://frankfurter.dev) (free, ECB-based, no API key), relative to the primary currency. A scheduled job refreshes them daily at 01:00 — keep Laravel's scheduler running.

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
