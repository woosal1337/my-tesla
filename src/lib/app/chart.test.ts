import { describe, expect, test } from "bun:test";
import { buildChart } from "./chart";

const style = {
  timeZone: "Europe/Istanbul",
  clock: "24h" as const,
  dateOrder: "day-month" as const,
  locale: "en-US",
  animate: true,
};

const start = Date.parse("2026-10-17T07:07:00Z");

const rows = [0, 35, 70, 105].map((minutes, index) => ({
  at: start + minutes * 60_000,
  speed: [0, 64, 118, 40][index]!,
  power: [-12, 30, 55, null][index] ?? null,
}));

describe("buildChart", () => {
  test("puts clock ticks on round local times", () => {
    const chart = buildChart({
      title: "Speed and power",
      rows,
      xKey: "at",
      xFormat: "clock",
      style,
      series: [
        { key: "speed", label: "Speed", unit: "km/h", color: "chart1" },
        {
          key: "power",
          label: "Power",
          unit: "kW",
          color: "chart4",
          axis: "right",
        },
      ],
      left: "zero",
    });
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "10:30",
      "11:00",
      "11:30",
    ]);
    expect(chart?.points[0]?.label.endsWith("10:07")).toBe(true);
    expect(chart?.points[3]?.values).toEqual([40, null]);
  });

  test("starts a zero axis at zero and keeps a second unit on the right", () => {
    const chart = buildChart({
      title: "Speed and power",
      rows,
      xKey: "at",
      xFormat: "clock",
      style,
      series: [
        { key: "speed", label: "Speed", unit: "km/h", color: "chart1" },
        {
          key: "power",
          label: "Power",
          unit: "kW",
          color: "chart4",
          axis: "right",
        },
      ],
      left: "zero",
    });
    expect(chart?.left.domain).toEqual([0, 125]);
    expect(chart?.left.ticks.at(-1)).toEqual({ value: 125, label: "125" });
    expect(chart?.right?.domain[0]).toBeLessThanOrEqual(-12);
    expect(chart?.series[1]).toMatchObject({ axis: "right", kind: "line" });
  });

  test("picks up to five ticks from bucket starts", () => {
    const weeks = Array.from({ length: 9 }, (_, index) => ({
      at: Date.parse("2026-08-03T00:00:00Z") + index * 7 * 86_400_000,
      km: 100 + index,
    }));
    const chart = buildChart({
      title: "Distance",
      rows: weeks,
      xKey: "at",
      xFormat: "day",
      style,
      series: [
        {
          key: "km",
          label: "Distance",
          unit: "km",
          color: "chart1",
          kind: "bar",
        },
      ],
      left: "zero",
    });
    expect(chart?.x.ticks.map((tick) => tick.value)).toEqual(
      [0, 2, 4, 6, 8].map((index) => weeks[index]!.at),
    );
  });

  test("gives no chart for fewer than two points", () => {
    expect(
      buildChart({
        title: "Speed",
        rows: rows.slice(0, 1),
        xKey: "at",
        xFormat: "clock",
        style,
        series: [
          { key: "speed", label: "Speed", unit: "km/h", color: "chart1" },
        ],
      }),
    ).toBeNull();
  });

  test("gives a battery level axis even ticks and a fixed percent axis", () => {
    const chart = buildChart({
      title: "Power by battery level (kW)",
      rows: [12, 30, 55, 78].map((level, index) => ({
        level,
        power: [170, 150, 90, 40][index]!,
        battery: level,
      })),
      xKey: "level",
      xFormat: "percent",
      style,
      series: [
        { key: "battery", label: "Battery", unit: "%", color: "chart1" },
        {
          key: "power",
          label: "Power",
          unit: "kW",
          color: "charge",
          axis: "right",
        },
      ],
      left: "percent",
      leftFormat: "percent",
      right: "zero",
    });
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "20%",
      "40%",
      "60%",
    ]);
    expect(chart?.left.ticks.map((tick) => tick.label)).toEqual([
      "0%",
      "25%",
      "50%",
      "75%",
      "100%",
    ]);
    expect(chart?.right?.domain).toEqual([0, 200]);
  });

  test("keeps percent ticks on whole numbers so no label repeats", () => {
    const chart = buildChart({
      title: "Battery (%)",
      rows: [61, 61, 60].map((battery, index) => ({
        at: start + index * 60_000,
        battery,
      })),
      xKey: "at",
      xFormat: "clock",
      style,
      leftFormat: "percent",
      series: [
        { key: "battery", label: "Battery", unit: "%", color: "chart2" },
      ],
    });
    const labels = chart?.left.ticks.map((tick) => tick.label) ?? [];
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(["59%", "60%", "61%", "62%"]);
  });

  test("puts the ticks of a bar chart on its buckets", () => {
    const chart = buildChart({
      title: "Charge levels",
      rows: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((level) => ({
        level,
        start: 1,
      })),
      xKey: "level",
      xFormat: "percent",
      style,
      left: "zero",
      series: [
        {
          key: "start",
          label: "Start",
          unit: "",
          color: "chart3",
          kind: "bar",
        },
      ],
    });
    const levels = chart?.points.map((point) => point.x) ?? [];
    expect(chart?.x.ticks.every((tick) => levels.includes(tick.value))).toBe(
      true,
    );
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "0%",
      "20%",
      "40%",
      "60%",
      "80%",
    ]);
  });

  test("gives a count axis whole steps from zero", () => {
    const countTicks = (largest: number) =>
      buildChart({
        title: "Charge levels",
        rows: [0, 10].map((level, index) => ({
          level,
          start: index ? largest : 0,
        })),
        xKey: "level",
        xFormat: "percent",
        style,
        left: "count",
        series: [
          {
            key: "start",
            label: "Start",
            unit: "",
            color: "chart3",
            kind: "bar",
          },
        ],
      })?.left.ticks ?? [];
    expect(countTicks(9).map((tick) => tick.label)).toEqual([
      "0",
      "2",
      "4",
      "6",
      "8",
      "10",
    ]);
    expect(countTicks(1).map((tick) => tick.label)).toEqual(["0", "1"]);
    expect(countTicks(11).map((tick) => tick.label)).toEqual([
      "0",
      "5",
      "10",
      "15",
    ]);
    for (const largest of [1, 3, 9, 11, 26, 140]) {
      expect(
        countTicks(largest).every((tick) => Number.isInteger(tick.value)),
      ).toBe(true);
    }
  });

  const months = Array.from({ length: 12 }, (_, index) => ({
    at: Date.UTC(2026, index, 15),
    km: 900 + index,
  }));

  const monthChart = (dateOrder: "day-month" | "iso") =>
    buildChart({
      title: "Distance",
      rows: months,
      xKey: "at",
      xFormat: "month",
      style: { ...style, dateOrder },
      left: "zero",
      series: [
        {
          key: "km",
          label: "Distance",
          unit: "km",
          color: "chart1",
          kind: "bar",
        },
      ],
    });

  test("labels every third of twelve months with the full year", () => {
    const chart = monthChart("day-month");
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "Jan 2026",
      "Apr 2026",
      "Jul 2026",
      "Oct 2026",
    ]);
    expect(chart?.points[7]?.label).toBe("Aug 2026");
    expect(monthChart("iso")?.x.ticks[1]?.label).toBe("2026-04");
  });

  test("puts the unit of the horizontal axis on its ticks", () => {
    const chart = buildChart({
      title: "Efficiency and temperature",
      rows: [18, 24, 31].map((temperature, index) => ({
        temperature,
        efficiency: [160, 150, 155][index]!,
      })),
      xKey: "temperature",
      xFormat: "number",
      xUnit: "°C",
      style,
      series: [
        {
          key: "efficiency",
          label: "Efficiency",
          unit: "Wh/km",
          color: "chart1",
          kind: "dot",
        },
      ],
    });
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "20 °C",
      "25 °C",
      "30 °C",
    ]);
    expect(chart?.points[0]?.label).toBe("18 °C");
  });

  test("drops a day label that would touch the label before it", () => {
    const days = [
      "2026-10-02",
      "2026-10-06",
      "2026-10-17",
      "2026-10-19",
      "2026-10-22",
      "2026-10-28",
      "2026-11-03",
      "2026-11-09",
      "2026-11-14",
    ].map((day, index) => ({
      at: Date.parse(`${day}T09:00:00Z`),
      kwh: 70 + index / 10,
    }));
    const chart = buildChart({
      title: "Capacity",
      rows: days,
      xKey: "at",
      xFormat: "day",
      style,
      series: [{ key: "kwh", label: "Capacity", unit: "kWh", color: "chart1" }],
    });
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "2 Oct",
      "17 Oct",
      "3 Nov",
      "14 Nov",
    ]);
  });

  test("labels every second of five month bars, so the labels keep a gap", () => {
    const chart = buildChart({
      title: "Distance",
      rows: months.slice(0, 5),
      xKey: "at",
      xFormat: "month",
      style,
      left: "zero",
      series: [
        {
          key: "km",
          label: "Distance",
          unit: "km",
          color: "chart1",
          kind: "bar",
        },
      ],
    });
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "Jan 2026",
      "Mar 2026",
      "May 2026",
    ]);
  });

  test("keeps fewer clock labels, at even gaps, next to a second axis", () => {
    const drive = Array.from({ length: 25 }, (_, index) => ({
      at: Date.parse("2026-10-17T07:10:00Z") + index * 10 * 60_000,
      speed: 80,
      power: 20,
    }));
    const chart = buildChart({
      title: "Speed and power",
      rows: drive,
      xKey: "at",
      xFormat: "clock",
      style: { ...style, clock: "12h" },
      series: [
        { key: "speed", label: "Speed", unit: "km/h", color: "chart1" },
        {
          key: "power",
          label: "Power",
          unit: "kW",
          color: "chart4",
          axis: "right",
        },
      ],
      left: "zero",
    });
    expect(chart?.x.ticks.map((tick) => tick.label)).toEqual([
      "11:00 AM",
      "1:00 PM",
    ]);
  });

  const lineChart = (values: number[]) =>
    buildChart({
      title: "Elevation",
      rows: values.map((value, index) => ({
        at: start + index * 60_000,
        value,
      })),
      xKey: "at",
      xFormat: "clock",
      style,
      series: [{ key: "value", label: "Value", unit: "m", color: "chart3" }],
    });

  const filled = (values: number[]) => {
    const [low, high] = lineChart(values)?.left.domain ?? [0, 1];
    return (Math.max(...values) - Math.min(...values)) / (high - low);
  };

  test("fits the value axis close to the values", () => {
    expect(lineChart([265, 300, 340])?.left.domain).toEqual([260, 360]);
    const odometer = lineChart([2400, 3300, 4100])?.left;
    expect(odometer?.domain).toEqual([2000, 4500]);
    expect(odometer?.ticks.map((tick) => tick.label)).toEqual([
      "2.0k",
      "2.5k",
      "3.0k",
      "3.5k",
      "4.0k",
      "4.5k",
    ]);
    expect(filled([265, 300, 340])).toBeGreaterThanOrEqual(0.5);
    expect(filled([2400, 3300, 4100])).toBeGreaterThanOrEqual(0.5);
  });

  test("takes a coarser value axis when two ticks would share a label", () => {
    const labels = (values: number[]) =>
      lineChart(values)?.left.ticks.map((tick) => tick.label) ?? [];
    expect(labels([2606, 2680, 2744])).toEqual([
      "2.5k",
      "2.6k",
      "2.7k",
      "2.8k",
    ]);
    expect(labels([41210, 41290, 41380])).toEqual([
      "41.2k",
      "41.3k",
      "41.4k",
      "41.5k",
    ]);
    for (const values of [
      [2606, 2680, 2744],
      [41210, 41290, 41380],
      [1171, 1250, 1368],
      [12040, 12100, 12190],
    ]) {
      const { domain, ticks } = lineChart(values)!.left;
      expect(new Set(ticks.map((tick) => tick.label)).size).toBe(ticks.length);
      expect(domain[0]).toBeLessThanOrEqual(Math.min(...values));
      expect(domain[1]).toBeGreaterThanOrEqual(Math.max(...values));
    }
  });

  test("starts the value axis at zero or above for values from zero", () => {
    expect(lineChart([0.2, 3, 5])?.left.domain[0]).toBe(0);
    expect(lineChart([12, 40, 61])?.left.domain[0]).toBeGreaterThanOrEqual(0);
  });

  test("passes the caption and the line style through", () => {
    const chart = buildChart({
      title: "By battery level",
      caption: "By battery level (%)",
      rows: [20, 50, 80].map((level) => ({ level, a: level, b: level })),
      xKey: "level",
      xFormat: "percent",
      style,
      series: [
        { key: "a", label: "A", unit: "km", color: "chart1" },
        { key: "b", label: "B", unit: "km", color: "chart4", dash: "dashed" },
      ],
    });
    expect(chart?.caption).toBe("By battery level (%)");
    expect(chart?.series.map((series) => series.dash)).toEqual([
      undefined,
      "dashed",
    ]);
    expect(lineChart([1, 2])).not.toHaveProperty("caption");
  });
});
