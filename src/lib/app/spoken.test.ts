import { describe, expect, test } from "bun:test";
import { createFormatter } from "../format";
import { defaultPreferences } from "../preferences";
import { unitLabels } from "../units";
import { spokenLabel } from "./spoken";

describe("spokenLabel", () => {
  const settings = (["km", "mi"] as const).flatMap((distance) =>
    (["wh-per-distance", "kwh-per-100", "distance-per-kwh"] as const).map(
      (efficiency) => ({ ...defaultPreferences, distance, efficiency }),
    ),
  );

  test.each(settings)(
    "writes out the $distance and $efficiency units",
    (setting) => {
      const f = createFormatter(setting, "UTC");
      const units = unitLabels(setting);
      const label = spokenLabel([f.distance(18), f.efficiency(134)]);
      expect(label.split(/,? /)).not.toContain(units.distance);
      expect(label).not.toContain(units.efficiency);
      expect(label).not.toContain("/");
      expect(label).toMatch(/(kilometers|miles)/);
      expect(label).toContain(" per ");
    },
  );

  test("says one or many", () => {
    expect(spokenLabel(["1 km"])).toBe("1 kilometer");
    expect(spokenLabel(["1.0 km"])).toBe("1.0 kilometers");
    expect(spokenLabel(["21 km"])).toBe("21 kilometers");
    expect(spokenLabel(["1 mi", "2 mi"])).toBe("1 mile, 2 miles");
  });

  test("writes out a duration", () => {
    expect(spokenLabel(["1 h 05 min"])).toBe("1 hour 5 minutes");
    expect(spokenLabel(["45 min"])).toBe("45 minutes");
    expect(spokenLabel(["101 h"])).toBe("101 hours");
    expect(spokenLabel(["1 h 01 min"])).toBe("1 hour 1 minute");
  });

  test("keeps each number style", () => {
    expect(spokenLabel(["1,234 mi"])).toBe("1,234 miles");
    expect(spokenLabel(["18,4 kWh/100 km"])).toBe(
      "18,4 kilowatt-hours per 100 kilometers",
    );
    expect(spokenLabel(["1 234 km"])).toBe("1 234 kilometers");
    expect(spokenLabel(["1.234 km"])).toBe("1.234 kilometers");
  });

  test("writes out energy, power, and efficiency", () => {
    expect(spokenLabel(["+52 kWh", "up to 250 kW"])).toBe(
      "+52 kilowatt-hours, up to 250 kilowatts",
    );
    expect(spokenLabel(["6.2 mi/kWh", "4.1 km/kWh", "212 Wh/mi"])).toBe(
      "6.2 miles per kilowatt-hour, 4.1 kilometers per kilowatt-hour, 212 watt-hours per mile",
    );
  });

  test("says the arrows, the dashes, and the dots as words and commas", () => {
    expect(spokenLabel(["20% → 80%"])).toBe("20% to 80%");
    expect(spokenLabel(["17:41 – 18:02"])).toBe("17:41 to 18:02");
    expect(spokenLabel(["from Office · 2 stops"])).toBe("from Office, 2 stops");
  });

  test("leaves out the empty parts", () => {
    expect(spokenLabel(["Home", null, false, "", undefined, "AC"])).toBe(
      "Home, AC",
    );
  });

  test("keeps a text without a unit", () => {
    for (const text of ["Room 5 hm", "Gate 7 kmh", "$18.20", "42%", "—"]) {
      expect(spokenLabel([text])).toBe(text);
    }
  });
});
