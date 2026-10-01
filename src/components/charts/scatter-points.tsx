"use client";

import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { formatChartNumber } from "./axis-format";

type Point = { x: number; y: number };

export function ScatterPoints({
  points,
  xLabel,
  xUnit,
  yLabel,
  yUnit,
  color,
  locale,
  animate = true,
  yDigits = 0,
  height = 260,
}: {
  points: Point[];
  xLabel: string;
  xUnit: string;
  yLabel: string;
  yUnit: string;
  color: string;
  locale: string;
  animate?: boolean;
  yDigits?: number;
  height?: number;
}) {
  return (
    <ChartContainer
      config={{ points: { label: yLabel, color } }}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <ScatterChart margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="x"
          type="number"
          domain={["auto", "auto"]}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) =>
            `${formatChartNumber(value, locale)} ${xUnit}`
          }
        />
        <YAxis
          dataKey="y"
          type="number"
          domain={["auto", "auto"]}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(value) => formatChartNumber(value, locale, yDigits)}
        />
        <Tooltip
          cursor={{ stroke: "var(--input)" }}
          content={(props) => {
            const point = props.payload?.[0]?.payload as Point | undefined;
            if (!props.active || !point) return null;
            return (
              <div className="rounded-lg bg-popover px-3 py-2 text-xs ring-1 ring-border">
                <p className="text-muted-foreground">
                  {xLabel}{" "}
                  <span className="font-medium text-foreground tabular">
                    {formatChartNumber(point.x, locale, 1)} {xUnit}
                  </span>
                </p>
                <p className="mt-1 text-muted-foreground">
                  {yLabel}{" "}
                  <span className="font-medium text-foreground tabular">
                    {formatChartNumber(point.y, locale, yDigits)} {yUnit}
                  </span>
                </p>
              </div>
            );
          }}
        />
        <Scatter
          data={points}
          fill="var(--color-points)"
          fillOpacity={0.6}
          isAnimationActive={animate}
          animationDuration={700}
        />
      </ScatterChart>
    </ChartContainer>
  );
}
