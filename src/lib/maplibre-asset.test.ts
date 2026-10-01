import { describe, expect, test } from "bun:test";
import { maplibreAsset, maplibreWorkerUrl } from "./maplibre-asset";

describe("maplibreAsset", () => {
  test("serves the worker and its shared chunk for the installed version", () => {
    expect(maplibreAsset("6.11.2", "maplibre-gl-worker.mjs", "6.11.2")).toBe(
      "maplibre-gl-worker.mjs",
    );
    expect(maplibreAsset("6.11.2", "maplibre-gl-shared.mjs", "6.11.2")).toBe(
      "maplibre-gl-shared.mjs",
    );
  });

  test("refuses another version, so an immutable cache never goes stale", () => {
    expect(
      maplibreAsset("6.10.0", "maplibre-gl-worker.mjs", "6.11.2"),
    ).toBeNull();
  });

  test.each([
    "maplibre-gl.mjs",
    "../package.json",
    "maplibre-gl-worker.mjs.map",
  ])("refuses the file %s", (file) => {
    expect(maplibreAsset("6.11.2", file, "6.11.2")).toBeNull();
  });

  test("builds the worker URL under the version folder", () => {
    expect(maplibreWorkerUrl("6.11.2")).toBe(
      "/maplibre/6.11.2/maplibre-gl-worker.mjs",
    );
  });
});
