import { describe, expect, test } from "bun:test";
import {
  currencyByCountry,
  currencyOfCountry,
  currencyOptions,
  defaultPreferences,
  mapThemeOf,
  parsePreferences,
  resolveTimeZone,
  teslamateDefaults,
} from "./preferences";

describe("parsePreferences", () => {
  test("keeps known values and drops unknown ones", () => {
    const parsed = parsePreferences({
      distance: "mi",
      temperature: "kelvin",
      pressure: "psi",
      currency: "TRY",
      period: "90d",
      refresh: "7",
      timeZone: "America/New_York",
    });
    expect(parsed.distance).toBe("mi");
    expect(parsed.temperature).toBe("c");
    expect(parsed.pressure).toBe("psi");
    expect(parsed.currency).toBe("TRY");
    expect(parsed.period).toBe("90d");
    expect(parsed.refresh).toBe("30");
    expect(parsed.timeZone).toBe("America/New_York");
  });

  test("refuses a time zone that Intl does not know", () => {
    expect(parsePreferences({ timeZone: "Mars/Olympus" }).timeZone).toBe(
      "auto",
    );
  });

  test("reads the car, the splash and the flags", () => {
    const parsed = parsePreferences({
      defaultCar: "2",
      splash: false,
      tabs: { stats: false, places: "no", extra: true },
      overview: { tires: false },
    });
    expect(parsed.defaultCar).toBe("2");
    expect(parsed.splash).toBe(false);
    expect(parsed.tabs).toEqual({
      drives: true,
      charging: true,
      battery: true,
      stats: false,
      places: true,
    });
    expect(parsed.overview.tires).toBe(false);
    expect(parsed.overview.today).toBe(true);
    expect(parsePreferences({ defaultCar: "../2" }).defaultCar).toBe("auto");
  });

  test("reads the charging prices", () => {
    const parsed = parsePreferences({
      chargePrice: 3.256789,
      fastChargePrice: 9,
    });
    expect(parsed.chargePrice).toBe(3.2568);
    expect(parsed.fastChargePrice).toBe(9);
    const base = parsePreferences({ chargePrice: 4 });
    expect(parsePreferences({ chargePrice: -1 }, base).chargePrice).toBe(4);
    expect(parsePreferences({ chargePrice: "4" }, base).chargePrice).toBe(4);
    expect(
      parsePreferences({ chargePrice: null }, base).chargePrice,
    ).toBeNull();
    expect(defaultPreferences.chargePrice).toBeNull();
  });

  test("falls back to the base for input that is not an object", () => {
    expect(parsePreferences(null)).toEqual(defaultPreferences);
    expect(parsePreferences("mi")).toEqual(defaultPreferences);
    const base = parsePreferences({ distance: "mi" });
    expect(parsePreferences({}, base).distance).toBe("mi");
  });
});

describe("teslamateDefaults", () => {
  test("maps the TeslaMate settings", () => {
    const defaults = teslamateDefaults({
      unitOfLength: "mi",
      unitOfTemperature: "F",
      unitOfPressure: "psi",
      preferredRange: "ideal",
      themeMode: "dark",
      chargingCountry: null,
    });
    expect(defaults.distance).toBe("mi");
    expect(defaults.temperature).toBe("f");
    expect(defaults.pressure).toBe("psi");
    expect(defaults.range).toBe("ideal");
    expect(defaults.theme).toBe("dark");
    expect(teslamateDefaults(null)).toEqual(defaultPreferences);
  });

  test("takes the currency of the charging country", () => {
    const base = teslamateDefaults({
      unitOfLength: "km",
      unitOfTemperature: "C",
      unitOfPressure: "bar",
      preferredRange: "rated",
      themeMode: "system",
      chargingCountry: "us",
    });
    expect(base.currency).toBe("USD");
    expect(parsePreferences({}, base).currency).toBe("USD");
    expect(parsePreferences({ currency: "none" }, base).currency).toBe("none");
  });
});

describe("currencyOfCountry", () => {
  test("maps a country code to a currency", () => {
    expect(currencyOfCountry("tr")).toBe("TRY");
    expect(currencyOfCountry("DE")).toBe("EUR");
    expect(currencyOfCountry("us")).toBe("USD");
    expect(currencyOfCountry("cz")).toBe("none");
    expect(currencyOfCountry(null)).toBe("none");
  });

  test("offers each mapped currency in Settings", () => {
    const ids = currencyOptions.map((option) => option.id);
    for (const currency of currencyByCountry.values()) {
      expect(ids).toContain(currency);
    }
    expect(new Set(currencyByCountry.values()).size).toBe(ids.length - 1);
  });
});

describe("resolved values", () => {
  test("uses the fallback time zone for auto", () => {
    expect(resolveTimeZone(defaultPreferences, "Europe/Istanbul")).toBe(
      "Europe/Istanbul",
    );
    expect(
      resolveTimeZone(
        { ...defaultPreferences, timeZone: "Asia/Tokyo" },
        "Europe/Istanbul",
      ),
    ).toBe("Asia/Tokyo");
  });

  test("picks the map theme", () => {
    expect(mapThemeOf({ mapTheme: "app", theme: "system" })).toBeUndefined();
    expect(mapThemeOf({ mapTheme: "app", theme: "dark" })).toBe("dark");
    expect(mapThemeOf({ mapTheme: "light", theme: "dark" })).toBe("light");
  });
});
