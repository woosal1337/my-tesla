import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { silverStops, teslaMarkPath } from "./logo";

const root = path.join(import.meta.dir, "../..");

describe("the static logo", () => {
  test.each(["src/app/icon.svg", "docs/images/logo.svg"])(
    "%s uses the T mark and the silver of the app",
    (file) => {
      const svg = readFileSync(path.join(root, file), "utf8");
      expect(svg).toContain(`d="${teslaMarkPath}"`);
      for (const [offset, color] of silverStops) {
        expect(svg).toContain(`offset="${offset}" stop-color="${color}"`);
      }
    },
  );
});
