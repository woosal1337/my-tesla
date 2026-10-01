import {
  formatClockAt,
  formatDayAt,
  formatMonthAt,
  type DateStyle,
} from "@/lib/date-format";

export type AxisFormat = "clock" | "day" | "month" | "percent" | "number";

export type ChartStyle = DateStyle & { locale: string; animate: boolean };

const numberFormats = new Map<string, Intl.NumberFormat>();

export function formatChartNumber(
  value: number,
  locale: string,
  digits = 0,
): string {
  const key = `${locale}:${digits}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
      signDisplay: "negative",
    });
    numberFormats.set(key, format);
  }
  return format.format(value);
}

export function formatAxis(
  value: unknown,
  format: AxisFormat,
  style: ChartStyle,
): string {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  if (format === "percent") return `${Math.round(number)}%`;
  if (format === "number") {
    return Math.abs(number) >= 1000
      ? `${formatChartNumber(Math.round(number / 100) / 10, style.locale, 1)}k`
      : formatChartNumber(
          number,
          style.locale,
          Number.isInteger(Math.round(number * 10) / 10) ? 0 : 1,
        );
  }
  const date = new Date(number);
  if (format === "clock") return formatClockAt(date, style);
  if (format === "month") return formatMonthAt(date, style);
  return formatDayAt(date, style, false);
}

export function formatTooltipLabel(
  value: unknown,
  format: AxisFormat,
  style: ChartStyle,
): string {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return String(value ?? "");
  const date = new Date(number);
  if (format === "clock") {
    return `${formatDayAt(date, style)} ${formatClockAt(date, style)}`;
  }
  if (format === "day") return formatDayAt(date, style);
  return formatAxis(value, format, style);
}
