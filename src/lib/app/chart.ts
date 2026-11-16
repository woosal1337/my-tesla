import {
  formatAxis,
  formatTooltipLabel,
  type AxisFormat,
  type ChartStyle,
} from "@/components/charts/axis-format";
import {
  evenStep,
  evenTicks,
  fitAxis,
  niceDomain,
  niceStep,
  niceZeroDomain,
} from "@/components/charts/nice-domain";
import { localParts } from "../date-format";
import type {
  AppAxis,
  AppChart,
  AppTick,
  ChartColor,
  ChartDash,
} from "./contract";

type ChartSeriesInput = {
  key: string;
  label: string;
  unit: string;
  color: ChartColor;
  dash?: ChartDash;
  kind?: "area" | "line" | "bar" | "dot";
  axis?: "left" | "right";
  digits?: number;
};

type Row = Record<string, number | null>;

type AxisMode = "zero" | "auto" | "percent" | "count";

export type ChartInput = {
  title: string;
  caption?: string;
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
const phonePlotWidth = 262;
const secondAxisWidth = 32;
const labelCharWidth = 6.5;
const labelGap = 8;

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
  const labelOf = (value: number) => formatAxis(value, format, style);
  const ticksOf = (tickValues: number[]) =>
    tickValues.map((value) => ({ value, label: labelOf(value) }));
  const fitted = mode === "auto" ? fitAxis(values, labelOf) : undefined;
  const domain = fitted?.domain ?? domainOf(values, mode);
  const ticks = ticksOf(fitted?.ticks ?? evenTicks(domain));
  const labels = new Set(ticks.map((tick) => tick.label));
  if (labels.size === ticks.length) return { domain, ticks };
  const whole: [number, number] = [Math.floor(domain[0]), Math.ceil(domain[1])];
  return { domain: whole, ticks: ticksOf(evenTicks(whole)) };
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
  const values: number[] = [];
  for (
    let value = Math.ceil((start + offset) / stepMs) * stepMs - offset;
    value <= end;
    value += stepMs
  ) {
    values.push(value);
  }
  return values;
}

function stepTicks([start, end]: [number, number]): number[] {
  const step = evenStep((end - start) / maxClockIntervals || 1);
  const values: number[] = [];
  for (
    let value = Math.ceil(start / step) * step;
    value <= end;
    value += step
  ) {
    values.push(Math.round(value * 1e6) / 1e6);
  }
  return values;
}

function indexTicks(xs: number[]): number[] {
  const count = Math.min(maxIndexTicks, xs.length);
  if (count < 2) return xs;
  return Array.from(
    { length: count },
    (_, index) => xs[Math.round((index * (xs.length - 1)) / (count - 1))]!,
  );
}

function labelWidth(tick: AppTick): number {
  return tick.label.length * labelCharWidth;
}

function barTicks(ticks: AppTick[], plotWidth: number): AppTick[] {
  const widest = Math.max(...ticks.map(labelWidth));
  const stride = Math.max(
    Math.ceil(ticks.length / maxIndexTicks),
    Math.ceil((widest + labelGap) / (plotWidth / ticks.length)),
  );
  return ticks.filter((_, index) => index % stride === 0);
}

function spacedTicks(
  ticks: AppTick[],
  [start, end]: [number, number],
  plotWidth: number,
): AppTick[] {
  const kept: AppTick[] = [];
  let edge = -Infinity;
  for (const tick of ticks) {
    const center =
      end > start ? ((tick.value - start) / (end - start)) * plotWidth : 0;
    const half = labelWidth(tick) / 2;
    if (center - half < edge + labelGap) continue;
    kept.push(tick);
    edge = center + half;
  }
  return kept;
}

function strideTicks(
  ticks: AppTick[],
  domain: [number, number],
  plotWidth: number,
): AppTick[] {
  for (let stride = 1; ; stride += 1) {
    const kept = ticks.filter((_, index) => index % stride === 0);
    if (spacedTicks(kept, domain, plotWidth).length === kept.length) {
      return kept;
    }
  }
}

function xTicks(
  xs: number[],
  domain: [number, number],
  label: (value: number) => string,
  format: AxisFormat,
  style: ChartStyle,
  bars: boolean,
  plotWidth: number,
): AppTick[] {
  const ticksOf = (values: number[]) =>
    values.map((value) => ({ value, label: label(value) }));
  if (bars) return barTicks(ticksOf(xs), plotWidth);
  if (format === "clock") {
    return strideTicks(ticksOf(clockTicks(domain, style)), domain, plotWidth);
  }
  if (format === "percent" || format === "number") {
    return strideTicks(ticksOf(stepTicks(domain)), domain, plotWidth);
  }
  return spacedTicks(ticksOf(indexTicks(xs)), domain, plotWidth);
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
    ...(input.caption ? { caption: input.caption } : {}),
    locale: style.locale,
    series,
    points,
    x: {
      domain: xDomain,
      ticks: xTicks(
        xs,
        xDomain,
        (value) => withUnit(formatAxis(value, input.xFormat, style)),
        input.xFormat,
        style,
        series.some((entry) => entry.kind === "bar"),
        rightKeys.length ? phonePlotWidth - secondAxisWidth : phonePlotWidth,
      ),
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
