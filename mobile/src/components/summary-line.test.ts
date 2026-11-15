import { describe, expect, test } from "bun:test";
import { headingLine, summaryLine } from "./summary-line";

describe("summaryLine", () => {
  test("keeps the words of a part together and breaks only between parts", () => {
    expect(summaryLine(["Juniper", "12 recent charges", "71.49 spent"])).toBe(
      "Juniper · 12\u00a0recent\u00a0charges · 71.49\u00a0spent",
    );
  });

  test("leaves a part without a space the same", () => {
    expect(summaryLine(["Juniper", "492"])).toBe("Juniper · 492");
  });

  test("gives an empty text for no parts", () => {
    expect(summaryLine([])).toBe("");
  });
});

describe("headingLine", () => {
  test("gives the day and its total", () => {
    expect(
      headingLine({ title: "Wed 21 Oct", total: ["4 trips", "64 km"] }),
    ).toBe("Wed\u00a021\u00a0Oct · 4\u00a0trips · 64\u00a0km");
  });

  test("gives only the day when an older server sends no total", () => {
    expect(headingLine({ title: "Wed 21 Oct" })).toBe("Wed\u00a021\u00a0Oct");
  });
});
