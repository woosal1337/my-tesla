import {
  clockText,
  dayText,
  hourText,
  localParts,
  type DateStyle,
  type LocalParts,
} from "./date-format";
import type { Preferences } from "./preferences";
import {
  efficiencyDigits,
  pressureDigits,
  toDistance,
  toEfficiency,
  toElevation,
  toPressure,
  toSpeed,
  toTemperature,
  unitLabels,
} from "./units";

const missing = "—";

const numberLocales: Record<Preferences["numberStyle"], string> = {
  "comma-dot": "en-US",
  "dot-comma": "de-DE",
  "space-comma": "fr-FR",
};

export function durationText(minutes: number | null | undefined): string {
  if (!isNumber(minutes) || minutes < 0) return missing;
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest
    ? `${hours} h ${String(rest).padStart(2, "0")} min`
    : `${hours} h`;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sameDay(a: LocalParts, b: LocalParts) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export type FormatSettings = Pick<
  Preferences,
  | "distance"
  | "temperature"
  | "pressure"
  | "efficiency"
  | "clock"
  | "dateOrder"
  | "numberStyle"
  | "currency"
  | "motion"
>;

export type Formatter = ReturnType<typeof createFormatter>;

export function createFormatter(settings: FormatSettings, timeZone: string) {
  const units = unitLabels(settings);
  const style: DateStyle = {
    timeZone,
    clock: settings.clock,
    dateOrder: settings.dateOrder,
  };
  const locale = numberLocales[settings.numberStyle];
  const numberFormats = new Map<number, Intl.NumberFormat>();
  const currencyFormat =
    settings.currency === "none"
      ? null
      : new Intl.NumberFormat(locale, {
          style: "currency",
          currency: settings.currency,
          currencyDisplay: "narrowSymbol",
        });

  function number(value: number, digits = 0): string {
    let format = numberFormats.get(digits);
    if (!format) {
      format = new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        signDisplay: "negative",
      });
      numberFormats.set(digits, format);
    }
    return format.format(value);
  }

  function withUnit(value: number | null, digits: number, unit: string) {
    return value === null ? missing : `${number(value, digits)} ${unit}`;
  }

  function adaptive(value: number) {
    return Math.abs(value) < 10 ? 1 : 0;
  }

  function day(date: Date, now: Date): string {
    const parts = localParts(date, timeZone);
    if (sameDay(parts, localParts(now, timeZone))) return "Today";
    const yesterday = new Date(now.getTime() - 86_400_000);
    if (sameDay(parts, localParts(yesterday, timeZone))) return "Yesterday";
    return dayText(parts, style);
  }

  const duration = durationText;

  return {
    settings,
    timeZone,
    units,
    style,
    locale,
    chartStyle: { ...style, locale, animate: settings.motion !== "reduced" },
    number,
    distanceValue(km: number | null | undefined): number | null {
      return isNumber(km) ? toDistance(km, settings) : null;
    },
    distance(km: number | null | undefined): string {
      if (!isNumber(km)) return missing;
      const value = toDistance(km, settings);
      return withUnit(value, adaptive(value), units.distance);
    },
    speedValue(kmh: number | null | undefined): number | null {
      return isNumber(kmh) ? toSpeed(kmh, settings) : null;
    },
    speed(kmh: number | null | undefined): string {
      return isNumber(kmh)
        ? withUnit(toSpeed(kmh, settings), 0, units.speed)
        : missing;
    },
    elevationValue(meters: number | null | undefined): number | null {
      return isNumber(meters) ? toElevation(meters, settings) : null;
    },
    elevation(meters: number | null | undefined): string {
      return isNumber(meters)
        ? withUnit(toElevation(meters, settings), 0, units.elevation)
        : missing;
    },
    temperatureValue(celsius: number | null | undefined): number | null {
      return isNumber(celsius) ? toTemperature(celsius, settings) : null;
    },
    temperature(celsius: number | null | undefined): string {
      return isNumber(celsius)
        ? withUnit(toTemperature(celsius, settings), 0, units.temperature)
        : missing;
    },
    pressureValue(bar: number | null | undefined): number | null {
      return isNumber(bar) ? toPressure(bar, settings) : null;
    },
    pressure(bar: number | null | undefined): string {
      return isNumber(bar)
        ? withUnit(
            toPressure(bar, settings),
            pressureDigits(settings),
            units.pressure,
          )
        : missing;
    },
    pressureNumber(bar: number | null | undefined): string {
      return isNumber(bar)
        ? number(toPressure(bar, settings), pressureDigits(settings))
        : missing;
    },
    efficiencyValue(whPerKm: number | null | undefined): number | null {
      return isNumber(whPerKm) ? toEfficiency(whPerKm, settings) : null;
    },
    efficiency(whPerKm: number | null | undefined): string {
      const value = isNumber(whPerKm) ? toEfficiency(whPerKm, settings) : null;
      return withUnit(value, efficiencyDigits(settings), units.efficiency);
    },
    efficiencyNumber(whPerKm: number | null | undefined): string {
      const value = isNumber(whPerKm) ? toEfficiency(whPerKm, settings) : null;
      return value === null
        ? missing
        : number(value, efficiencyDigits(settings));
    },
    energy(kwh: number | null | undefined): string {
      return isNumber(kwh) ? withUnit(kwh, adaptive(kwh / 10), "kWh") : missing;
    },
    cost(value: number | null | undefined): string {
      if (!isNumber(value)) return missing;
      return currencyFormat ? currencyFormat.format(value) : number(value, 2);
    },
    duration,
    span(minutes: number | null | undefined): string {
      if (!isNumber(minutes) || minutes < 0) return missing;
      const days = minutes / 1440;
      if (days >= 10) return `${Math.round(days)} days`;
      if (days >= 2) return `${number(days, 1)} days`;
      return duration(minutes);
    },
    clock(date: Date): string {
      return clockText(localParts(date, timeZone), style);
    },
    hour(hour: number): string {
      return hourText(hour, style);
    },
    day,
    dayInline(date: Date, now: Date): string {
      const label = day(date, now);
      return label === "Today" || label === "Yesterday"
        ? label.toLowerCase()
        : label;
    },
    date(date: Date): string {
      return dayText(localParts(date, timeZone), style, false);
    },
    relative(date: Date | null, now: Date): string {
      if (!date) return "Never";
      const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
      if (seconds < 60) return "Just now";
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} min ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} h ago`;
      const days = Math.floor(hours / 24);
      return days === 1 ? "Yesterday" : `${days} d ago`;
    },
    groupByDay<T>(
      items: T[],
      dateOf: (item: T) => Date,
      now: Date,
    ): { label: string; items: T[] }[] {
      const groups: { key: string; label: string; items: T[] }[] = [];
      for (const item of items) {
        const date = dateOf(item);
        const parts = localParts(date, timeZone);
        const key = `${parts.year}-${parts.month}-${parts.day}`;
        const last = groups.at(-1);
        if (last?.key === key) {
          last.items.push(item);
        } else {
          groups.push({ key, label: day(date, now), items: [item] });
        }
      }
      return groups.map(({ label, items: groupItems }) => ({
        label,
        items: groupItems,
      }));
    },
  };
}
