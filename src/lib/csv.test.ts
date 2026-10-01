import { describe, expect, test } from "bun:test";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  test("writes numbers and empty values", () => {
    expect(csvCell(12.5)).toBe("12.5");
    expect(csvCell(-3)).toBe("-3");
    expect(csvCell(null)).toBe("");
    expect(csvCell(Number.NaN)).toBe("");
  });

  test("quotes commas, quotes, and line breaks", () => {
    expect(csvCell("Home, Tempe")).toBe('"Home, Tempe"');
    expect(csvCell('The "Lot"')).toBe('"The ""Lot"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
    expect(csvCell("Başiskele")).toBe("Başiskele");
  });

  test("stops a spreadsheet from running a formula", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
});

describe("toCsv", () => {
  test("writes a byte order mark and CRLF lines", () => {
    expect(
      toCsv(
        ["A", "B"],
        [
          [1, "x"],
          [null, "y, z"],
        ],
      ),
    ).toBe('﻿A,B\r\n1,x\r\n,"y, z"\r\n');
  });
});
