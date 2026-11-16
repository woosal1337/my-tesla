import {
  formatAxis,
  formatTooltipLabel,
  type AxisFormat,
  type ChartStyle,
} from "@/components/charts/axis-format";
import {
  evenStep,
  evenTicks,
  niceDomain,
  niceStep,
  niceZeroDomain,
} from "@/components/charts/nice-domain";
import { localParts } from "../date-format";
import type { AppAxis, AppChart, AppTick, ChartColor } from "./contract";

type ChartSeriesInput = {
  key: string;
  label: string;
  unit: string;
  color: ChartColor;
  kind?: "area" | "line" | "bar" | "dot";
  axis?: "left" | "right";
  digits?: number;
};

type Row = Record<string, number | null>;

type AxisMode = "zero" | "auto" | "percent" | "count";

export type ChartInput = {
  title: string;
  rows: Row[];
  xKey: string;
  xFormat: AxisFormat;
  series: ChartSeriesInput[];
  style: ChartStyle;
  left?: AxisMode;
  right?: AxisMode;
  leftFormat?: AxisFormat;
  xUnit?: string;
};

const minuteMs = 60_000;
const clockSteps = [1, 2, 5, 10, 15, 30, 60, 120, 180, 240, 360, 720, 1440];
const maxClockIntervals = 4;
const maxIndexTicks = 5;
const maxCountIntervals = 5;

function finiteValues(rows: Row[], keys: string[]): number[] {
  return rows.flatMap((row) =>
    keys.flatMap((key) => {
      const value = row[key];
      return typeof value === "number" && Number.isFinite(value) ? [value] : [];
    }),
  );
}

const percentDomain: [number, number] = [0, 100];

function domainOf(values: number[], mode: AxisMode): [number, number] {
  if (mode === "percent") return percentDomain;
  return (mode === "zero" ? niceZeroDomain : niceDomain)(values) ?? [0, 1];
}

function countAxis(values: number[], style: ChartStyle): AppAxis {
  const top = Math.max(1, ...values);
  const step = niceStep(Math.max(1, top / maxCountIntervals));
  const intervals = Math.ceil(top / step);
  return {
    domain: [0, intervals * step],
    ticks: Array.from({ length: intervals + 1 }, (_, index) => ({
      value: index * step,
      label: formatAxis(index * step, "number", style),
    })),
  };
}

function axis(
  values: number[],
  mode: AxisMode,
  format: AxisFormat,
  style: ChartStyle,
): AppAxis {
  if (mode === "count") return countAxis(values, style);
  const ticksOf = (domain: [number, number]) =>
    evenTicks(domain).map((value) => ({
      value,
      label: formatAxis(value, format, style),
    }));
  const domain = domainOf(values, mode);
  const ticks = ticksOf(domain);
  const labels = new Set(ticks.map((tick) => tick.label));
  if (labels.size === ticks.length) return { domain, ticks };
  const whole: [number, number] = [Math.floor(domain[0]), Math.ceil(domain[1])];
  return { domain: whole, ticks: ticksOf(whole) };
}

function localOffsetMs(at: number, timeZone: string): number {
  const parts = localParts(new Date(at), timeZone);
  const local = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return local - Math.floor(at / minuteMs) * minuteMs;
}

function clockTicks([start, end]: [number, number], style: ChartStyle) {
  const span = (end - start) / minuteMs;
  const stepMin =
    clockSteps.find((step) => span / step <= maxClockIntervals) ??
    clockSteps.at(-1)!;
  const stepMs = stepMin * minuteMs;
  const offset = localOffsetMs(start, style.timeZone);
  const ticks: AppTick[] = [];
  for (
    let value = Math.ceil((start + offset) / stepMs) * stepMs - offset;
    value <= end;
    value += stepMs
  ) {
    ticks.push({ value, label: formatAxis(value, "clock", style) });
  }
  return ticks;
}

function stepTicks(
  [start, end]: [number, number],
  format: AxisFormat,
  style: ChartStyle,
): AppTick[] {
  const step = evenStep((end - start) / maxClockIntervals || 1);
  const ticks: AppTick[] = [];
  for (
    let value = Math.ceil(start / step) * step;
    value <= end;
    value += step
  ) {
    const rounded = Math.round(value * 1e6) / 1e6;
    ticks.push({ value: rounded, label: formatAxis(rounded, format, style) });
  }
  return ticks;
}

function xTicks(
  xs: number[],
  domain: [number, number],
  format: AxisFormat,
  style: ChartStyle,
  bars: boolean,
): AppTick[] {
  if (bars) return barTicks(xs, format, style);
  if (format === "clock") return clockTicks(domain, style);
  if (format === "percent" || format === "number") {
    return stepTicks(domain, format, style);
  }
  return indexTicks(xs, format, style);
}

function barTicks(xs: number[], format: AxisFormat, style: ChartStyle) {
  const stride = Math.ceil(xs.length / maxIndexTicks);
  return xs
    .filter((_, index) => index % stride === 0)
    .map((value) => ({ value, label: formatAxis(value, format, style) }));
}

function indexTicks(xs: number[], format: AxisFormat, style: ChartStyle) {
  const count = Math.min(maxIndexTicks, xs.length);
  if (count < 2) {
    return xs.map((value) => ({
      value,
      label: formatAxis(value, format, style),
    }));
  }
  return Array.from({ length: count }, (_, index) => {
    const value = xs[Math.round((index * (xs.length - 1)) / (count - 1))]!;
    return { value, label: formatAxis(value, format, style) };
  });
}

export function buildChart(input: ChartInput): AppChart | null {
  const { rows, xKey, style } = input;
  const withUnit = (label: string) =>
    input.xUnit ? `${label} ${input.xUnit}` : label;
  const points = rows.flatMap((row) => {
    const x = row[xKey];
    if (typeof x !== "number" || !Number.isFinite(x)) return [];
    return [
      {
        x,
        label: withUnit(formatTooltipLabel(x, input.xFormat, style)),
        values: input.series.map((series) => row[series.key] ?? null),
      },
    ];
  });
  if (points.length < 2) return null;
  const series = input.series.map((entry) => ({
    kind: "line" as const,
    axis: "left" as const,
    digits: 0,
    ...entry,
  }));
  const keysOn = (side: "left" | "right") =>
    series.filter((entry) => entry.axis === side).map((entry) => entry.key);
  const rightKeys = keysOn("right");
  const xs = points.map((point) => point.x);
  const xDomain: [number, number] = [xs[0]!, xs.at(-1)!];
  return {
    title: input.title,
    locale: style.locale,
    series,
    points,
    x: {
      domain: xDomain,
      ticks: xTicks(
        xs,
        xDomain,
        input.xFormat,
        style,
        series.some((entry) => entry.kind === "bar"),
      ).map((tick) => ({ ...tick, label: withUnit(tick.label) })),
    },
    left: axis(
      finiteValues(rows, keysOn("left")),
      input.left ?? "auto",
      input.leftFormat ?? "number",
      style,
    ),
    right: rightKeys.length
      ? axis(
          finiteValues(rows, rightKeys),
          input.right ?? "auto",
          "number",
          style,
        )
      : null,
  };
}
