import { describe, expect, test } from "bun:test";
import { summaryLine } from "./summary-line";

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
