import { periods, type PeriodId } from "./insights";

type Option<T extends string> = { id: T; label: string };

function options<const T extends string>(
  list: readonly Option<T>[],
): readonly Option<T>[] {
  return list;
}

export const distanceOptions = options([
  { id: "km", label: "Kilometers" },
  { id: "mi", label: "Miles" },
]);

export const temperatureOptions = options([
  { id: "c", label: "Celsius" },
  { id: "f", label: "Fahrenheit" },
]);

export const pressureOptions = options([
  { id: "bar", label: "bar" },
  { id: "psi", label: "psi" },
  { id: "kpa", label: "kPa" },
]);

const efficiencyOptions = options([
  { id: "wh-per-distance", label: "Wh per distance" },
  { id: "kwh-per-100", label: "kWh per 100" },
  { id: "distance-per-kwh", label: "Distance per kWh" },
]);

export const rangeOptions = options([
  { id: "rated", label: "Rated" },
  { id: "ideal", label: "Ideal" },
]);

export const clockOptions = options([
  { id: "24h", label: "24-hour" },
  { id: "12h", label: "12-hour" },
]);

const dateOrderOptions = options([
  { id: "day-month", label: "Day first" },
  { id: "month-day", label: "Month first" },
  { id: "iso", label: "ISO" },
]);

export const numberStyleOptions = options([
  { id: "comma-dot", label: "1,234.5" },
  { id: "dot-comma", label: "1.234,5" },
  { id: "space-comma", label: "1 234,5" },
]);

export const currencyOptions = options([
  { id: "none", label: "No symbol" },
  { id: "TRY", label: "Turkish lira" },
  { id: "EUR", label: "Euro" },
  { id: "USD", label: "US dollar" },
  { id: "GBP", label: "British pound" },
  { id: "CHF", label: "Swiss franc" },
  { id: "NOK", label: "Norwegian krone" },
  { id: "SEK", label: "Swedish krona" },
  { id: "DKK", label: "Danish krone" },
  { id: "PLN", label: "Polish złoty" },
  { id: "CAD", label: "Canadian dollar" },
  { id: "AUD", label: "Australian dollar" },
  { id: "JPY", label: "Japanese yen" },
  { id: "CNY", label: "Chinese yuan" },
]);

export const weekStartOptions = options([
  { id: "monday", label: "Monday" },
  { id: "sunday", label: "Sunday" },
]);

export const placeNameOptions = options([
  { id: "geofence", label: "Geofence first" },
  { id: "address", label: "Address only" },
]);

export const addressDetailOptions = options([
  { id: "full", label: "Full" },
  { id: "street", label: "Street" },
  { id: "city", label: "City" },
]);

export const mapOptions = options([
  { id: "show", label: "Show" },
  { id: "hide", label: "Hide" },
]);

export const mapThemeOptions = options([
  { id: "app", label: "Match app" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
]);

export const themeOptions = options([
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
]);

export const refreshOptions = options([
  { id: "off", label: "Off" },
  { id: "15", label: "15 s" },
  { id: "30", label: "30 s" },
  { id: "60", label: "1 min" },
  { id: "300", label: "5 min" },
]);

export const motionOptions = options([
  { id: "full", label: "Full" },
  { id: "reduced", label: "Reduced" },
]);

export const tabKeys = [
  { id: "drives", label: "Drives" },
  { id: "charging", label: "Charging" },
  { id: "battery", label: "Battery" },
  { id: "stats", label: "Stats" },
  { id: "places", label: "Places" },
] as const;

export const overviewKeys = [
  { id: "render", label: "Car image" },
  { id: "today", label: "Today" },
  { id: "tires", label: "Tires" },
  { id: "location", label: "Location" },
  { id: "recent", label: "Last drive and charge" },
] as const;

type Ids<T extends readonly { id: string }[]> = T[number]["id"];

type TabKey = Ids<typeof tabKeys>;
type OverviewKey = Ids<typeof overviewKeys>;

export type Preferences = {
  distance: Ids<typeof distanceOptions>;
  temperature: Ids<typeof temperatureOptions>;
  pressure: Ids<typeof pressureOptions>;
  efficiency: Ids<typeof efficiencyOptions>;
  range: Ids<typeof rangeOptions>;
  clock: Ids<typeof clockOptions>;
  dateOrder: Ids<typeof dateOrderOptions>;
  numberStyle: Ids<typeof numberStyleOptions>;
  currency: Ids<typeof currencyOptions>;
  timeZone: string;
  weekStart: Ids<typeof weekStartOptions>;
  placeNames: Ids<typeof placeNameOptions>;
  addressDetail: Ids<typeof addressDetailOptions>;
  maps: Ids<typeof mapOptions>;
  mapTheme: Ids<typeof mapThemeOptions>;
  theme: Ids<typeof themeOptions>;
  period: PeriodId;
  refresh: Ids<typeof refreshOptions>;
  defaultCar: string;
  motion: Ids<typeof motionOptions>;
  splash: boolean;
  tabs: Record<TabKey, boolean>;
  overview: Record<OverviewKey, boolean>;
};

export const autoTimeZone = "auto";
export const autoCar = "auto";

export const defaultPreferences: Preferences = {
  distance: "km",
  temperature: "c",
  pressure: "bar",
  efficiency: "wh-per-distance",
  range: "rated",
  clock: "24h",
  dateOrder: "day-month",
  numberStyle: "comma-dot",
  currency: "none",
  timeZone: autoTimeZone,
  weekStart: "monday",
  placeNames: "geofence",
  addressDetail: "full",
  maps: "show",
  mapTheme: "app",
  theme: "system",
  period: "30d",
  refresh: "30",
  defaultCar: autoCar,
  motion: "full",
  splash: true,
  tabs: {
    drives: true,
    charging: true,
    battery: true,
    stats: true,
    places: true,
  },
  overview: {
    render: true,
    today: true,
    tires: true,
    location: true,
    recent: true,
  },
};

const choices = {
  distance: distanceOptions,
  temperature: temperatureOptions,
  pressure: pressureOptions,
  efficiency: efficiencyOptions,
  range: rangeOptions,
  clock: clockOptions,
  dateOrder: dateOrderOptions,
  numberStyle: numberStyleOptions,
  currency: currencyOptions,
  weekStart: weekStartOptions,
  placeNames: placeNameOptions,
  addressDetail: addressDetailOptions,
  maps: mapOptions,
  mapTheme: mapThemeOptions,
  theme: themeOptions,
  period: periods,
  refresh: refreshOptions,
  motion: motionOptions,
} as const;

type ChoiceKey = keyof typeof choices;

function isTimeZone(value: string): boolean {
  if (!value || value.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function flags<K extends string>(
  keys: readonly { id: K }[],
  value: unknown,
  base: Record<K, boolean>,
): Record<K, boolean> {
  const input = record(value);
  return Object.fromEntries(
    keys.map(({ id }) => [
      id,
      typeof input[id] === "boolean" ? input[id] : base[id],
    ]),
  ) as Record<K, boolean>;
}

export function parsePreferences(
  value: unknown,
  base: Preferences = defaultPreferences,
): Preferences {
  const input = record(value);
  const result: Preferences = { ...base, tabs: { ...base.tabs } };
  for (const key of Object.keys(choices) as ChoiceKey[]) {
    const candidate = input[key];
    if (choices[key].some((option) => option.id === candidate)) {
      Object.assign(result, { [key]: candidate });
    }
  }
  const timeZone = input.timeZone;
  if (
    typeof timeZone === "string" &&
    (timeZone === autoTimeZone || isTimeZone(timeZone))
  ) {
    result.timeZone = timeZone;
  }
  const car = input.defaultCar;
  if (typeof car === "string" && (car === autoCar || /^\d{1,9}$/.test(car))) {
    result.defaultCar = car;
  }
  if (typeof input.splash === "boolean") result.splash = input.splash;
  result.tabs = flags(tabKeys, input.tabs, base.tabs);
  result.overview = flags(overviewKeys, input.overview, base.overview);
  return result;
}

export type TeslaMateSettings = {
  unitOfLength: string | null;
  unitOfTemperature: string | null;
  unitOfPressure: string | null;
  preferredRange: string | null;
  themeMode: string | null;
};

export function teslamateDefaults(
  settings: TeslaMateSettings | null,
): Preferences {
  if (!settings) return defaultPreferences;
  return parsePreferences({
    distance: settings.unitOfLength,
    temperature: settings.unitOfTemperature?.toLowerCase(),
    pressure: settings.unitOfPressure,
    range: settings.preferredRange,
    theme: settings.themeMode,
  });
}

export function resolveTimeZone(
  preferences: Preferences,
  fallback: string,
): string {
  return preferences.timeZone === autoTimeZone
    ? fallback
    : preferences.timeZone;
}

export function mapThemeOf(
  preferences: Pick<Preferences, "mapTheme" | "theme">,
): "light" | "dark" | undefined {
  if (preferences.mapTheme !== "app") return preferences.mapTheme;
  return preferences.theme === "system" ? undefined : preferences.theme;
}
