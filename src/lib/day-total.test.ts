import { describe, expect, test } from "bun:test";
import { chargesDayTotal, tripsDayTotal } from "./day-total";
import { createFormatter } from "./format";
import { defaultPreferences } from "./preferences";

const f = createFormatter(defaultPreferences, "UTC");
const miles = createFormatter({ ...defaultPreferences, distance: "mi" }, "UTC");

describe("tripsDayTotal", () => {
  test("gives the count and the distance of the trips of a day", () => {
    const trips = [20, 12.2, 30, 2].map((distanceKm) => ({ distanceKm }));
    expect(tripsDayTotal(trips, f)).toEqual(["4 trips", "64 km"]);
  });

  test("names one trip in the singular", () => {
    expect(tripsDayTotal([{ distanceKm: 12.4 }], f)).toEqual([
      "1 trip",
      "12 km",
    ]);
  });

  test("gives the distance in the units of the person", () => {
    expect(tripsDayTotal([{ distanceKm: 64.2 }], miles)[1]).toBe("40 mi");
  });

  test("gives no total without trips", () => {
    expect(tripsDayTotal([], f)).toEqual([]);
  });
});

describe("chargesDayTotal", () => {
  test("adds the energy of the charges of a day", () => {
    const charges = [16.5, 2.44].map((energyAddedKwh) => ({ energyAddedKwh }));
    expect(chargesDayTotal(charges, f)).toEqual(["+18.9 kWh"]);
  });

  test("leaves out a charge without a value", () => {
    expect(
      chargesDayTotal([{ energyAddedKwh: null }, { energyAddedKwh: 16.5 }], f),
    ).toEqual(["+16.5 kWh"]);
  });

  test("gives no total when no charge has a value", () => {
    expect(chargesDayTotal([{ energyAddedKwh: null }], f)).toEqual([]);
  });
});
