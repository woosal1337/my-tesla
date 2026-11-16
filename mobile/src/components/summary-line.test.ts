import { describe, expect, test } from "bun:test";
import { dottedLine, headingLine, summaryLine } from "./summary-line";

const nbsp = "\u00a0";

describe("summaryLine", () => {
  test("keeps the words of a part together and breaks only before a separator", () => {
    expect(summaryLine(["Juniper", "12 recent charges", "71.49 spent"])).toBe(
      `Juniper ·${nbsp}12${nbsp}recent${nbsp}charges ·${nbsp}71.49${nbsp}spent`,
    );
  });

  test("leaves a part without a space the same", () => {
    expect(summaryLine(["Juniper", "492"])).toBe(`Juniper ·${nbsp}492`);
  });

  test("gives an empty text for no parts", () => {
    expect(summaryLine([])).toBe("");
  });
});

describe("dottedLine", () => {
  test("keeps a count with its word and the separator with the next part", () => {
    expect(
      dottedLine("from Hotel Grand Canyon · 1 stop, 1 with a charge"),
    ).toBe(
      `from Hotel Grand Canyon ·${nbsp}1${nbsp}stop, 1${nbsp}with a charge`,
    );
  });

  test("keeps the normal spaces of a place name", () => {
    expect(
      dottedLine(
        "Home → South Mountain Lookout Summit Trail · 20 km · 25 min · Yesterday 17:05",
      ),
    ).toBe(
      `Home → South Mountain Lookout Summit Trail ·${nbsp}20${nbsp}km ·${nbsp}25${nbsp}min ·${nbsp}Yesterday 17:05`,
    );
  });

  test("does not bind a number at the end of a part to the separator", () => {
    expect(dottedLine("Route 66 · 9:41 AM")).toBe(
      `Route 66 ·${nbsp}9:41${nbsp}AM`,
    );
  });

  test("leaves a text without a separator or a count the same", () => {
    expect(dottedLine("Curves, charging times, and places")).toBe(
      "Curves, charging times, and places",
    );
  });
});

describe("headingLine", () => {
  test("gives the day and its total", () => {
    expect(
      headingLine({ title: "Wed 21 Oct", total: ["4 trips", "64 km"] }),
    ).toBe(`Wed${nbsp}21${nbsp}Oct ·${nbsp}4${nbsp}trips ·${nbsp}64${nbsp}km`);
  });

  test("gives only the day when an older server sends no total", () => {
    expect(headingLine({ title: "Wed 21 Oct" })).toBe(`Wed${nbsp}21${nbsp}Oct`);
  });
});
