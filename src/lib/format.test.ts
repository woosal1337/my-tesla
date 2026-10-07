import { describe, expect, test } from "bun:test";
import { createFormatter } from "./format";
import { defaultPreferences, type Preferences } from "./preferences";

const istanbul = "Europe/Istanbul";
const now = new Date("2026-10-01T09:00:00Z");
const metric = createFormatter(defaultPreferences, istanbul);

function formatter(change: Partial<Preferences>, timeZone = istanbul) {
  return createFormatter({ ...defaultPreferences, ...change }, timeZone);
}

describe("metric units", () => {
  test.each([
    [null, "—"],
    [0.44, "0.4 km"],
    [9.96, "10.0 km"],
    [12.4, "12 km"],
    [1234.5, "1,235 km"],
  ])("distance(%p)", (value, expected) => {
    expect(metric.distance(value)).toBe(expected);
  });

  test.each([
    [null, "—"],
    [-3, "—"],
    [7, "7 min"],
    [59.6, "1 h"],
    [65, "1 h 05 min"],
    [185, "3 h 05 min"],
    [5999, "99 h 59 min"],
    [7534, "126 h"],
  ])("duration(%p)", (value, expected) => {
    expect(metric.duration(value)).toBe(expected);
  });

  test("formats energy, temperature, pressure, efficiency and cost", () => {
    expect(metric.energy(12.345)).toBe("12.3 kWh");
    expect(metric.energy(1250)).toBe("1,250 kWh");
    expect(metric.temperature(15.5)).toBe("16 °C");
    expect(metric.temperature(-0.4)).toBe("0 °C");
    expect(metric.pressure(2.925)).toBe("2.9 bar");
    expect(metric.efficiency(151.6)).toBe("152 Wh/km");
    expect(metric.speed(124)).toBe("124 km/h");
    expect(metric.cost(4.5)).toBe("4.50");
    expect(metric.energy(Number.NaN)).toBe("—");
  });
});

describe("imperial and other units", () => {
  const imperial = formatter({
    distance: "mi",
    temperature: "f",
    pressure: "psi",
  });

  test("converts distance, speed, temperature and pressure", () => {
    expect(imperial.distance(160.9344)).toBe("100 mi");
    expect(imperial.speed(100)).toBe("62 mph");
    expect(imperial.temperature(20)).toBe("68 °F");
    expect(imperial.pressure(2.9)).toBe("42 psi");
    expect(imperial.efficiency(150)).toBe("241 Wh/mi");
    expect(imperial.elevation(100)).toBe("328 ft");
  });

  test("gives kPa and the other efficiency forms", () => {
    expect(formatter({ pressure: "kpa" }).pressure(2.9)).toBe("290 kPa");
    expect(formatter({ efficiency: "kwh-per-100" }).efficiency(152)).toBe(
      "15.2 kWh/100 km",
    );
    expect(formatter({ efficiency: "distance-per-kwh" }).efficiency(152)).toBe(
      "6.6 km/kWh",
    );
    expect(
      formatter({ distance: "mi", efficiency: "distance-per-kwh" }).efficiency(
        152,
      ),
    ).toBe("4.1 mi/kWh");
  });

  test("uses the number style and the currency", () => {
    expect(formatter({ numberStyle: "dot-comma" }).distance(1234.5)).toBe(
      "1.235 km",
    );
    expect(formatter({ numberStyle: "dot-comma" }).energy(12.3)).toBe(
      "12,3 kWh",
    );
    expect(formatter({ currency: "TRY" }).cost(1234.5)).toBe("₺1,234.50");
    expect(
      formatter({ currency: "EUR", numberStyle: "dot-comma" }).cost(4.5),
    ).toBe("4,50\u00a0€");
  });
});

describe("time formats", () => {
  test.each([
    [null, "Never"],
    [new Date("2026-10-01T08:59:30Z"), "Just now"],
    [new Date("2026-10-01T08:15:00Z"), "45 min ago"],
    [new Date("2026-10-01T04:00:00Z"), "5 h ago"],
    [new Date("2026-09-30T08:00:00Z"), "Yesterday"],
    [new Date("2026-09-27T09:00:00Z"), "4 d ago"],
  ])("relative(%p)", (date, expected) => {
    expect(metric.relative(date, now)).toBe(expected);
  });

  test("formats the clock in the display time zone", () => {
    const at = new Date("2026-09-30T20:26:36Z");
    expect(metric.clock(at)).toBe("23:26");
    expect(formatter({ clock: "12h" }).clock(at)).toBe("11:26 PM");
    expect(
      formatter({ clock: "12h" }).clock(new Date("2026-09-30T21:05:00Z")),
    ).toBe("12:05 AM");
    expect(formatter({}, "America/New_York").clock(at)).toBe("16:26");
  });

  test("names today and yesterday in the display time zone", () => {
    expect(metric.day(new Date("2026-09-30T22:30:00Z"), now)).toBe("Today");
    expect(metric.day(new Date("2026-09-30T20:00:00Z"), now)).toBe("Yesterday");
    expect(metric.day(new Date("2026-09-27T12:00:00Z"), now)).toBe(
      "Sun 27 Sep",
    );
  });

  test("follows the date order", () => {
    const at = new Date("2026-09-27T12:00:00Z");
    expect(formatter({ dateOrder: "month-day" }).day(at, now)).toBe(
      "Sun, Sep 27",
    );
    expect(formatter({ dateOrder: "iso" }).day(at, now)).toBe("Sun 2026-09-27");
    expect(formatter({ dateOrder: "iso" }).date(at)).toBe("2026-09-27");
  });

  test("lowercases only the relative day names inline", () => {
    const noon = new Date("2026-10-01T12:00:00Z");
    expect(metric.dayInline(noon, noon)).toBe("today");
    expect(metric.dayInline(new Date("2026-09-30T12:00:00Z"), noon)).toBe(
      "yesterday",
    );
    expect(metric.dayInline(new Date("2026-09-25T12:00:00Z"), noon)).toBe(
      "Fri 25 Sep",
    );
  });

  test("labels the hours for the clock", () => {
    expect(metric.hour(0)).toBe("00:00");
    expect(metric.hour(24)).toBe("24:00");
    expect(formatter({ clock: "12h" }).hour(0)).toBe("12 AM");
    expect(formatter({ clock: "12h" }).hour(18)).toBe("6 PM");
    expect(formatter({ clock: "12h" }).hour(24)).toBe("12 AM");
  });

  test("groups consecutive items by local day", () => {
    const items = [
      { id: 1, at: new Date("2026-10-01T06:00:00Z") },
      { id: 2, at: new Date("2026-09-30T22:10:00Z") },
      { id: 3, at: new Date("2026-09-30T20:00:00Z") },
    ];
    expect(metric.groupByDay(items, (item) => item.at, now)).toEqual([
      { label: "Today", items: [items[0], items[1]] },
      { label: "Yesterday", items: [items[2]] },
    ]);
  });

  test("switches to days for long spans", () => {
    expect(metric.span(95)).toBe("1 h 35 min");
    expect(metric.span(60 * 30)).toBe("30 h");
    expect(metric.span(60 * 60)).toBe("2.5 days");
    expect(metric.span(60 * 24 * 18.3)).toBe("18 days");
    expect(metric.span(null)).toBe("—");
  });
});
