# 0030: The default currency comes from the charging country

Date: 2026-11-16

Status: Accepted.

## Context

Each cost on the web and in the app showed as a number without a currency, for example "423 kWh added · 59.93 spent" in Charging and "Charging cost 34.68" in Stats. A person could not tell the currency.

The default of the Currency setting is "No symbol". The other defaults come from the TeslaMate settings page, but TeslaMate stores no currency. A person who never opened Settings saw no currency, and the demo showed none.

TeslaMate stores the full Nominatim answer of each address in `addresses.raw`. The answer gives the country as a two-letter code in `address.country_code`.

## Decision

1. Without a saved currency, the currency comes from the country where the cars charged most often. The server reads the country code of the address of each charge:

   ```sql
   select a.raw->'address'->>'country_code'
   from charging_processes cp
   join addresses a on a.id = cp.address_id
   where a.raw->'address'->>'country_code' is not null
   group by 1
   order by count(*) desc, 1
   limit 1
   ```

2. A fixed table in `src/lib/preferences.ts` maps the country to one of the 13 currencies of Settings. The 21 members of the euro area give EUR. Türkiye gives TRY, the United States USD, the United Kingdom GBP, Switzerland CHF, Norway NOK, Sweden SEK, Denmark DKK, Poland PLN, Canada CAD, Australia AUD, Japan JPY, and China CNY. Another country gives "No symbol".
3. The demo addresses carry the country code `us`, so the demo shows US dollars through the same rule.
4. A saved currency always wins. A saved "No symbol" stays.

The server builds the defaults once for the web and the app, so both show the same cost text. The change needs no new field in the app answers and no new app build.

## Alternatives

1. The server locale. A container usually has no locale, so most installs get no currency.
2. A notice in Charging while the currency is "No symbol", with a link to Settings. It needs a new field in the app answers, a link on two clients, and a stored "dismissed" state. Without that state, a person who wants "No symbol" sees the notice forever.
3. A fixed currency for the demo only. A real install then still shows no currency.
4. A new default in `defaultPreferences`. One currency for all installs is wrong for most of them.

## Consequences

- A country outside the table keeps "No symbol", as before. Examples are Czechia, Hungary, and South Korea.
- An account with saved Settings keeps its saved currency. The server stores the full Settings on each save, so an account that saved any setting before this change keeps "No symbol", also when the person never chose it.
- A demo visitor with an older Settings cookie keeps "No symbol" until "Reset to defaults".
- The country query shares one cached query with the units of the TeslaMate settings. If it fails, those defaults also fall back for that request.

## Sources

- [TeslaMate geocoder](https://github.com/teslamate-org/teslamate/blob/main/elixir/lib/teslamate/locations/geocoder.ex), read on 2026-11-16: `into_address` stores the Nominatim answer in `raw`.
- [Nominatim output format](https://nominatim.org/release-docs/latest/api/Output/), read on 2026-11-16: `address` holds `country_code`.
- [Countries using the euro](https://european-union.europa.eu/institutions-law-budget/euro/countries-using-euro_en), read on 2026-11-16: 21 members, with Bulgaria.
