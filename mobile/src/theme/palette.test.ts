import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { palettes } from "./palette";

const webTheme = readFileSync(
  path.join(import.meta.dir, "../../../src/app/globals.css"),
  "utf8",
);

function webColor(name: string): { light: string; dark: string } {
  const token = name
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    .replace(/(\d+)$/, "-$1");
  const value = new RegExp(`--${token}:\\s*([^;]+);`).exec(webTheme)?.[1];
  if (!value) throw new Error(`globals.css has no --${token}`);
  const pair = /^light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)$/i.exec(value);
  return pair
    ? { light: pair[1]!, dark: pair[2]! }
    : { light: value, dark: value };
}

function luminance(hex: string): number {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrast(text: string, surface: string): number {
  const [light, dark] = [luminance(text), luminance(surface)].sort(
    (a, b) => b - a,
  );
  return (light! + 0.05) / (dark! + 0.05);
}

describe("palettes", () => {
  test("the text tones have 4.5:1 on the page and on the card", () => {
    for (const palette of [palettes.light, palettes.dark]) {
      for (const tone of [
        "foreground",
        "secondaryForeground",
        "mutedForeground",
        "good",
        "bad",
        "warning",
        "charge",
        "destructive",
      ] as const) {
        for (const surface of ["background", "card"] as const) {
          expect(
            contrast(palette[tone], palette[surface]),
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  test("each theme has one green, one amber, and one red", () => {
    for (const palette of [palettes.light, palettes.dark]) {
      expect(palette.charge).toBe(palette.good);
      expect(palette.chart2).toBe(palette.good);
      expect(palette.destructive).toBe(palette.bad);
      expect(palette.chart4).toBe(palette.warning);
    }
  });

  test("match the color tokens of the web dashboard", () => {
    for (const name of Object.keys(palettes.light)) {
      const key = name as keyof typeof palettes.light;
      const colors: { light: string; dark: string } = {
        light: palettes.light[key],
        dark: palettes.dark[key],
      };
      expect(colors).toEqual(webColor(name));
    }
  });
});
