"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatAxis, type AxisFormat, type ChartStyle } from "./axis-format";
import { ChartTooltip, type Series } from "./chart-tooltip";

type Row = Record<string, number | null>;

export function SeriesChart({
  data,
  xKey,
  xFormat,
  series,
  chartStyle,
  height = 240,
  yDomain,
  rightDomain,
  xLabel,
  yFormat = "number",
}: {
  data: Row[];
  xKey: string;
  xFormat: AxisFormat;
  series: Series[];
  chartStyle: ChartStyle;
  height?: number;
  yDomain?: [number | "auto", number | "auto"];
  rightDomain?: [number | "auto", number | "auto"];
  xLabel?: string;
  yFormat?: AxisFormat;
}) {
  const config: ChartConfig = Object.fromEntries(
    series.map((line) => [line.key, { label: line.label, color: line.color }]),
  );
  const hasRight = series.some((line) => line.axis === "right");
  const hasBars = series.some((line) => line.kind === "bar");
  const numericX = xFormat !== "number" || !hasBars;

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {series.map((line) => (
            <span key={line.key} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: line.color }}
              />
              {line.label}
              {line.unit ? ` (${line.unit})` : ""}
            </span>
          ))}
        </div>
      )}
      <ChartContainer
        config={config}
        className="aspect-auto w-full"
        style={{ height }}
      >
        <ComposedChart
          data={data}
          margin={{ top: 8, right: hasRight ? 0 : 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey={xKey}
            type={numericX && !hasBars ? "number" : "category"}
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={36}
            tickFormatter={(value) => formatAxis(value, xFormat, chartStyle)}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            width={44}
            tickMargin={6}
            domain={yDomain ?? ["auto", "auto"]}
            tickFormatter={(value) => formatAxis(value, yFormat, chartStyle)}
          />
          {hasRight && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={40}
              tickMargin={6}
              domain={rightDomain ?? ["auto", "auto"]}
              tickFormatter={(value) => formatAxis(value, "number", chartStyle)}
            />
          )}
          <Tooltip
            cursor={
              hasBars
                ? { fill: "var(--accent)", opacity: 0.5 }
                : { stroke: "var(--input)", strokeWidth: 1 }
            }
            content={(props) => (
              <ChartTooltip
                active={props.active}
                payload={props.payload as never}
                label={props.label}
                series={series}
                xFormat={xFormat}
                chartStyle={chartStyle}
                xLabel={xLabel}
              />
            )}
          />
          {series.map((line) => {
            const common = {
              yAxisId: line.axis ?? "left",
              dataKey: line.key,
              name: line.key,
              isAnimationActive: chartStyle.animate,
              animationDuration: 700,
              animationEasing: "ease-out" as const,
            };
            if (line.kind === "bar") {
              return (
                <Bar
                  key={line.key}
                  {...common}
                  fill={`var(--color-${line.key})`}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                />
              );
            }
            if (line.kind === "area") {
              return (
                <Area
                  key={line.key}
                  {...common}
                  type="monotone"
                  stroke={`var(--color-${line.key})`}
                  strokeWidth={2}
                  fill={`var(--color-${line.key})`}
                  fillOpacity={0.12}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              );
            }
            return (
              <Line
                key={line.key}
                {...common}
                type="monotone"
                stroke={`var(--color-${line.key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
                connectNulls
              />
            );
          })}
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
