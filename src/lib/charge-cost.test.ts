import { describe, expect, test } from "bun:test";
import { costBreakdown, parsePrice, priceText, readPrice } from "./charge-cost";

describe("prices", () => {
  test.each([
    ["3.25", 3.25],
    ["3,25", 3.25],
    [" 12 ", 12],
    ["0", 0],
    ["1 000", 1000],
    ["", null],
    ["   ", null],
    ["-1", "invalid"],
    ["3.2.1", "invalid"],
    ["abc", "invalid"],
    ["1e3", "invalid"],
    ["200000", "invalid"],
  ])("parsePrice(%p)", (text, expected) => {
    expect(parsePrice(text)).toBe(expected as number | null | "invalid");
  });

  test("rounds a price to four digits and refuses a bad value", () => {
    expect(readPrice(0.123456)).toBe(0.1235);
    expect(readPrice(Number.NaN)).toBeNull();
    expect(readPrice(-0.5)).toBeNull();
    expect(readPrice("2")).toBeNull();
  });

  test("writes a price for the input in the number style", () => {
    expect(priceText(3.25, false)).toBe("3.25");
    expect(priceText(3.25, true)).toBe("3,25");
    expect(priceText(null, true)).toBe("");
  });
});

describe("costBreakdown", () => {
  test("splits the cost of a charge", () => {
    const breakdown = costBreakdown({
      cost: 124.25,
      addedKwh: 33.1,
      billedKwh: 35.5,
      rangeAdded: 243,
      levelsAdded: 54,
    });
    expect(breakdown?.perKwhBilled).toBeCloseTo(3.5, 6);
    expect(breakdown?.perKwhAdded).toBeCloseTo(3.7538, 4);
    expect(breakdown?.lossKwh).toBeCloseTo(2.4, 6);
    expect(breakdown?.lossCost).toBeCloseTo(8.4, 6);
    expect(breakdown?.per100Range).toBeCloseTo(51.1317, 4);
    expect(breakdown?.perLevel).toBeCloseTo(2.3009, 4);
  });

  test("leaves out a ratio without its base", () => {
    const breakdown = costBreakdown({
      cost: 0,
      addedKwh: 20,
      billedKwh: 19,
      rangeAdded: null,
      levelsAdded: 0,
    });
    expect(breakdown?.lossKwh).toBeNull();
    expect(breakdown?.lossCost).toBeNull();
    expect(breakdown?.per100Range).toBeNull();
    expect(breakdown?.perLevel).toBeNull();
    expect(breakdown?.perKwhAdded).toBe(0);
  });

  test("gives nothing without a cost", () => {
    expect(
      costBreakdown({
        cost: null,
        addedKwh: 20,
        billedKwh: 21,
        rangeAdded: 100,
        levelsAdded: 20,
      }),
    ).toBeNull();
  });
});
