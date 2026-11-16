import { parsePrice } from "../charge-cost";
import { createFormatter } from "../format";
import { periods } from "../insights";
import {
  addressDetailOptions,
  autoTimeZone,
  clockOptions,
  currencyOptions,
  distanceOptions,
  mapOptions,
  mapThemeOptions,
  numberStyleOptions,
  overviewKeys,
  parsePreferences,
  placeNameOptions,
  pressureOptions,
  rangeOptions,
  resolveTimeZone,
  temperatureOptions,
  weekStartOptions,
  type Preferences,
} from "../preferences";
import { previewRows } from "../settings-preview";
import type { SettingItem, SettingOption, SettingsPage } from "./contract";
import { appStat } from "./values";

const efficiencyChoices = [
  { id: "wh-per-distance", label: "Wh per distance" },
  { id: "kwh-per-100", label: "kWh per 100" },
  { id: "distance-per-kwh", label: "Distance per kWh" },
];

const dateOrderChoices = [
  { id: "day-month", label: "Day first" },
  { id: "month-day", label: "Month first" },
  { id: "iso", label: "ISO" },
];

const choiceKeys = [
  "distance",
  "temperature",
  "pressure",
  "efficiency",
  "range",
  "timeZone",
  "clock",
  "dateOrder",
  "weekStart",
  "numberStyle",
  "currency",
  "placeNames",
  "addressDetail",
  "maps",
  "mapTheme",
  "period",
] as const;

const priceKeys = ["chargePrice", "fastChargePrice"] as const;

type ChoiceKey = (typeof choiceKeys)[number];
type PriceKey = (typeof priceKeys)[number];

export type SettingChange = { key: string; value: unknown };

function choice(
  key: ChoiceKey,
  label: string,
  preferences: Preferences,
  options: readonly SettingOption[],
  hint: string | null = null,
): SettingItem {
  return {
    key,
    kind: "choice",
    label,
    hint,
    value: String(preferences[key]),
    options: options.map(({ id, label: text }) => ({ id, label: text })),
  };
}

function price(
  key: PriceKey,
  label: string,
  preferences: Preferences,
  hint: string,
): SettingItem {
  return { key, kind: "price", label, hint, value: preferences[key] };
}

export function settingsPage(
  preferences: Preferences,
  timeZones: string[],
  serverTimeZone: string,
): SettingsPage {
  const f = createFormatter(
    preferences,
    resolveTimeZone(preferences, serverTimeZone),
  );
  return {
    preview: previewRows(f).map(([label, value]) => appStat(label, value)),
    groups: [
      {
        title: "Units",
        note: "Every screen, chart, and map label uses these units.",
        items: [
          choice(
            "distance",
            "Distance",
            preferences,
            distanceOptions,
            "Also sets speed, range, and elevation.",
          ),
          choice("temperature", "Temperature", preferences, temperatureOptions),
          choice("pressure", "Tire pressure", preferences, pressureOptions),
          choice(
            "efficiency",
            "Efficiency",
            preferences,
            efficiencyChoices,
            "Energy for each distance, or distance for each kWh.",
          ),
          choice(
            "range",
            "Range",
            preferences,
            rangeOptions,
            "Rated follows the official test figure. Ideal follows the older Tesla figure.",
          ),
        ],
      },
      {
        title: "Date and time",
        note: null,
        items: [
          choice(
            "timeZone",
            "Time zone",
            preferences,
            [
              { id: autoTimeZone, label: `Automatic (${serverTimeZone})` },
              ...timeZones.map((zone) => ({
                id: zone,
                label: zone.replaceAll("_", " "),
              })),
            ],
            "Days, hours, and charts use this time zone.",
          ),
          choice("clock", "Clock", preferences, clockOptions),
          choice("dateOrder", "Date", preferences, dateOrderChoices),
          choice(
            "weekStart",
            "First day of the week",
            preferences,
            weekStartOptions,
            "Sets the weekly bars and the drive heat map.",
          ),
        ],
      },
      {
        title: "Numbers",
        note: null,
        items: [
          choice(
            "numberStyle",
            "Number style",
            preferences,
            numberStyleOptions,
          ),
        ],
      },
      {
        title: "Charging cost",
        note: "TeslaMate records a cost only for a charge in a geofence with a price. The app uses your price for the other charges.",
        items: [
          choice(
            "currency",
            "Currency",
            preferences,
            currencyOptions,
            "TeslaMate stores costs without a currency.",
          ),
          price(
            "chargePrice",
            "Price per kWh",
            preferences,
            "The app multiplies the energy from the charger by this price.",
          ),
          price(
            "fastChargePrice",
            "Fast charging price",
            preferences,
            "Optional. Replaces the price above at DC fast chargers.",
          ),
        ],
      },
      {
        title: "Location",
        note: "The data is a location history. Hide the maps before you share the screen.",
        items: [
          choice(
            "placeNames",
            "Place names",
            preferences,
            placeNameOptions,
            "A geofence is a place that you name in TeslaMate.",
          ),
          choice(
            "addressDetail",
            "Address detail",
            preferences,
            addressDetailOptions,
          ),
          choice("maps", "Maps", preferences, mapOptions),
          choice("mapTheme", "Map theme", preferences, mapThemeOptions),
        ],
      },
      {
        title: "Insights",
        note: null,
        items: [
          choice(
            "period",
            "Default period",
            preferences,
            periods,
            "The first period of Battery, Stats, Places, and Charging insights.",
          ),
        ],
      },
      {
        title: "Overview",
        note: null,
        items: cardSwitches(preferences, true),
      },
      {
        title: "Status and Location",
        note: null,
        items: cardSwitches(preferences, false),
      },
    ],
  };
}

const overviewScreenSwitches: readonly string[] = ["render", "recent"];

function cardSwitches(
  preferences: Preferences,
  onOverview: boolean,
): SettingItem[] {
  return overviewKeys
    .filter(({ id }) => overviewScreenSwitches.includes(id) === onOverview)
    .map(({ id, label }): SettingItem => ({
      key: `overview.${id}`,
      kind: "switch",
      label,
      hint: null,
      value: preferences.overview[id],
    }));
}

function isChoiceKey(key: string): key is ChoiceKey {
  return (choiceKeys as readonly string[]).includes(key);
}

function isPriceKey(key: string): key is PriceKey {
  return (priceKeys as readonly string[]).includes(key);
}

export function applySetting(
  current: Preferences,
  change: SettingChange,
  base: Preferences,
): Preferences | null {
  const { key, value } = change;
  if (isPriceKey(key)) {
    if (typeof value !== "string") return null;
    const parsed = parsePrice(value);
    if (parsed === "invalid") return null;
    return parsePreferences({ ...current, [key]: parsed }, base);
  }
  if (key.startsWith("overview.")) {
    const flag = key.slice("overview.".length);
    if (!overviewKeys.some(({ id }) => id === flag)) return null;
    if (typeof value !== "boolean") return null;
    return parsePreferences(
      { ...current, overview: { ...current.overview, [flag]: value } },
      base,
    );
  }
  if (!isChoiceKey(key) || typeof value !== "string") return null;
  const next = parsePreferences({ ...current, [key]: value }, base);
  return next[key] === value ? next : null;
}
