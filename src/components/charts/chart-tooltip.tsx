"use client";

import {
  formatChartNumber,
  formatTooltipLabel,
  type AxisFormat,
  type ChartStyle,
} from "./axis-format";

export type Series = {
  key: string;
  label: string;
  color: string;
  unit?: string;
  digits?: number;
  kind?: "line" | "area" | "bar";
  axis?: "left" | "right";
};

type TooltipItem = { dataKey?: unknown; value?: unknown };

export function ChartTooltip({
  active,
  payload,
  label,
  series,
  xFormat,
  chartStyle,
  xLabel,
}: {
  active?: boolean;
  payload?: readonly TooltipItem[];
  label?: unknown;
  series: Series[];
  xFormat: AxisFormat;
  chartStyle: ChartStyle;
  xLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground ring-1 ring-border">
      <p className="mb-1.5 font-medium">
        {xLabel ? `${xLabel} ` : ""}
        {formatTooltipLabel(label, xFormat, chartStyle)}
      </p>
      <div className="grid gap-1">
        {payload.map((item) => {
          const line = series.find((entry) => entry.key === item.dataKey);
          if (!line || typeof item.value !== "number") return null;
          return (
            <div
              key={line.key}
              className="flex items-center justify-between gap-4"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2 rounded-full"
                  style={{ background: line.color }}
                />
                {line.label}
              </span>
              <span className="font-medium tabular">
                {formatChartNumber(
                  item.value,
                  chartStyle.locale,
                  line.digits ?? 0,
                )}
                {line.unit ? ` ${line.unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
