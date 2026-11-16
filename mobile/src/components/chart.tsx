import type { AppChart, AppChartSeries, ChartDash } from "@contract";
import { useState } from "react";
import { StyleSheet, View, type GestureResponderEvent } from "react-native";
import Svg, { Circle, G, Line, Path, Rect } from "react-native-svg";
import { largeTextCap } from "@/theme/text-size";
import { space } from "@/theme/tokens";
import { chartColor } from "@/theme/tones";
import { usePalette } from "@/theme/use-palette";
import { useAxisScale } from "@/theme/use-text-size";
import {
  areaPath,
  baselineValue,
  hasBars,
  linePath,
  nearestIndex,
  scale,
  type Plot,
} from "./chart-geometry";
import { Text } from "./text";

const baseAxisWidth = 40;
const labelHeight = 20;
const formats = new Map<string, Intl.NumberFormat>();
const dashPatterns: Record<ChartDash, number[] | undefined> = {
  solid: undefined,
  dashed: [6, 8],
  dotted: [1, 8],
  dashDot: [8, 8, 1, 8],
};
const sampleWidth = 22;
const sampleHeight = 8;

function dashOf(series: AppChartSeries): number[] | undefined {
  return series.dash ? dashPatterns[series.dash] : undefined;
}

function valueText(
  value: number | null,
  series: AppChartSeries,
  locale: string,
): string {
  if (value === null) return "—";
  const key = `${locale}:${series.digits}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, {
      minimumFractionDigits: series.digits,
      maximumFractionDigits: series.digits,
    });
    formats.set(key, format);
  }
  const text = format.format(value);
  return series.unit === "%"
    ? `${text}%`
    : `${text}${series.unit ? ` ${series.unit}` : ""}`;
}

function LegendSample({
  series,
  dashed,
}: {
  series: AppChartSeries;
  dashed: boolean;
}) {
  const palette = usePalette();
  const color = chartColor(palette, series.color);
  if (!dashed) {
    return <View style={[styles.dot, { backgroundColor: color }]} />;
  }
  return (
    <Svg width={sampleWidth} height={sampleHeight}>
      <Line
        x1={1}
        x2={sampleWidth - 1}
        y1={sampleHeight / 2}
        y2={sampleHeight / 2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={dashOf(series)}
      />
    </Svg>
  );
}

function Legend({ chart }: { chart: AppChart }) {
  if (chart.series.length < 2) return null;
  const mixedUnits =
    new Set(chart.series.map((series) => series.unit)).size > 1;
  const dashed = chart.series.some((series) => dashOf(series));
  return (
    <View style={styles.legend}>
      {chart.series.map((series) => (
        <View key={series.key} style={styles.legendItem}>
          <LegendSample series={series} dashed={dashed} />
          <Text variant="caption" tone="mutedForeground">
            {series.label}
            {mixedUnits && series.unit ? ` (${series.unit})` : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function Chart({
  chart,
  height = 200,
}: {
  chart: AppChart;
  height?: number;
}) {
  const palette = usePalette();
  const axisWidth = baseAxisWidth * useAxisScale();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const bars = hasBars(chart);
  const plot: Plot = {
    left: axisWidth,
    right: width - (chart.right ? axisWidth : space.sm),
    top: space.sm,
    bottom: height - labelHeight,
  };
  const count = chart.points.length;
  const band = (plot.right - plot.left) / Math.max(1, count);
  const xOf = (index: number) =>
    bars
      ? plot.left + band * (index + 0.5)
      : scale(chart.points[index]!.x, chart.x.domain, [plot.left, plot.right]);
  const xs = chart.points.map((_, index) => xOf(index));
  const yOf = (value: number, axis: "left" | "right") =>
    scale(value, (axis === "right" ? chart.right : chart.left)!.domain, [
      plot.bottom,
      plot.top,
    ]);
  const barSeries = chart.series.filter((series) => series.kind === "bar");
  const barWidth = (band * 0.7) / Math.max(1, barSeries.length);

  const track = (event: GestureResponderEvent) => {
    setActive(nearestIndex(xs, event.nativeEvent.locationX));
  };
  const point = active === null ? null : chart.points[active];

  return (
    <View>
      {chart.caption ? (
        <Text
          variant="caption"
          tone="mutedForeground"
          accessibilityRole="header"
          style={styles.caption}
        >
          {chart.caption}
        </Text>
      ) : null}
      <Legend chart={chart} />
      <View
        accessible
        accessibilityLabel={`${chart.title} chart`}
        accessibilityHint="Touch and move along the chart to read the values"
        style={{ height }}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={track}
        onResponderMove={track}
        onResponderRelease={() => setActive(null)}
        onResponderTerminate={() => setActive(null)}
        onResponderTerminationRequest={() => true}
      >
        {width > 0 ? (
          <>
            <Svg width={width} height={height}>
              {chart.left.ticks.map((tick) => (
                <Line
                  key={tick.value}
                  x1={plot.left}
                  x2={plot.right}
                  y1={yOf(tick.value, "left")}
                  y2={yOf(tick.value, "left")}
                  stroke={palette.border}
                  strokeWidth={1}
                />
              ))}
              {chart.series.map((series, seriesIndex) => {
                const color = chartColor(palette, series.color);
                const domain = (
                  series.axis === "right" ? chart.right : chart.left
                )!.domain;
                if (series.kind === "bar") {
                  const slot = barSeries.indexOf(series);
                  const base = yOf(baselineValue(domain), series.axis);
                  return chart.points.map((entry, index) => {
                    const value = entry.values[seriesIndex];
                    if (value === null || value === undefined) return null;
                    const top = yOf(value, series.axis);
                    return (
                      <Rect
                        key={`${series.key}-${index}`}
                        x={xs[index]! - (band * 0.7) / 2 + slot * barWidth}
                        y={Math.min(top, base)}
                        width={Math.max(1, barWidth - 1)}
                        height={Math.abs(base - top)}
                        rx={2}
                        fill={color}
                        opacity={active === null || active === index ? 1 : 0.5}
                      />
                    );
                  });
                }
                if (series.kind === "dot") {
                  return chart.points.map((entry, index) => {
                    const value = entry.values[seriesIndex];
                    if (value === null || value === undefined) return null;
                    return (
                      <Circle
                        key={`${series.key}-${index}`}
                        cx={xs[index]}
                        cy={yOf(value, series.axis)}
                        r={active === index ? 5 : 3}
                        fill={color}
                        opacity={
                          active === null || active === index ? 0.75 : 0.35
                        }
                      />
                    );
                  });
                }
                const line = chart.points.map((entry, index) => {
                  const value = entry.values[seriesIndex];
                  return {
                    x: xs[index]!,
                    y:
                      value === null || value === undefined
                        ? null
                        : yOf(value, series.axis),
                  };
                });
                return (
                  <G key={series.key}>
                    {series.kind === "area" ? (
                      <Path
                        d={areaPath(
                          line,
                          yOf(baselineValue(domain), series.axis),
                        )}
                        fill={color}
                        opacity={0.16}
                      />
                    ) : null}
                    <Path
                      d={linePath(line)}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray={dashOf(series)}
                      fill="none"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </G>
                );
              })}
              {point && !bars ? (
                <Line
                  x1={xs[active!]}
                  x2={xs[active!]}
                  y1={plot.top}
                  y2={plot.bottom}
                  stroke={palette.input}
                  strokeWidth={1}
                />
              ) : null}
            </Svg>
            {chart.left.ticks.map((tick) => (
              <Text
                key={`left-${tick.value}`}
                variant="caption"
                numberOfLines={1}
                maxFontSizeMultiplier={largeTextCap}
                style={[
                  styles.axisLabel,
                  styles.leftLabel,
                  { top: yOf(tick.value, "left") - 8, width: axisWidth - 6 },
                ]}
              >
                {tick.label}
              </Text>
            ))}
            {chart.right?.ticks.map((tick) => (
              <Text
                key={`right-${tick.value}`}
                variant="caption"
                numberOfLines={1}
                maxFontSizeMultiplier={largeTextCap}
                style={[
                  styles.axisLabel,
                  styles.rightLabel,
                  { top: yOf(tick.value, "right") - 8, width: axisWidth - 6 },
                ]}
              >
                {tick.label}
              </Text>
            ))}
            {chart.x.ticks.map((tick) => {
              const index = chart.points.findIndex(
                (entry) => entry.x === tick.value,
              );
              const x = bars
                ? xOf(Math.max(0, index))
                : scale(tick.value, chart.x.domain, [plot.left, plot.right]);
              return (
                <Text
                  key={`x-${tick.value}`}
                  variant="caption"
                  numberOfLines={1}
                  maxFontSizeMultiplier={largeTextCap}
                  style={[
                    styles.xLabel,
                    { top: plot.bottom + 4, left: x - 32 },
                  ]}
                >
                  {tick.label}
                </Text>
              );
            })}
            {point ? (
              <View
                pointerEvents="none"
                style={[
                  styles.tooltip,
                  {
                    maxWidth: width / 2 - 8,
                    backgroundColor: palette.background,
                    borderColor: palette.border,
                  },
                  xs[active!]! > width / 2
                    ? { right: width - xs[active!]! + 8 }
                    : { left: xs[active!]! + 8 },
                ]}
              >
                <Text variant="caption" tone="mutedForeground">
                  {point.label}
                </Text>
                {chart.series.map((series, seriesIndex) => (
                  <Text key={series.key} variant="caption" tone="foreground">
                    {series.label}{" "}
                    {valueText(
                      point.values[seriesIndex] ?? null,
                      series,
                      chart.locale,
                    )}
                  </Text>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: space.lg,
    rowGap: space.xs,
    marginBottom: space.md,
  },
  caption: { marginBottom: space.sm },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  axisLabel: {
    position: "absolute",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  leftLabel: { left: 0, textAlign: "right" },
  rightLabel: { right: 0, textAlign: "left" },
  xLabel: {
    position: "absolute",
    width: 64,
    textAlign: "center",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  tooltip: {
    position: "absolute",
    top: 0,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
});
