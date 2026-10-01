import { describe, expect, test } from "bun:test";
import { carImageUrl, type CarImageInput } from "./car-image";

const rika: CarImageInput = {
  model: "Y",
  exteriorColor: "StealthGrey",
  wheelType: "Aperture18",
  trimBadging: "50",
};

function optionsOf(url: string | null): string | null {
  return url ? new URL(url).searchParams.get("options") : null;
}

describe("carImageUrl", () => {
  test("builds the 2025 Model Y render for a Stealth Grey car", () => {
    const url = carImageUrl(rika);
    expect(url).not.toBeNull();
    const parsed = new URL(url ?? "");
    expect(parsed.origin + parsed.pathname).toBe(
      "https://static-assets.tesla.com/configurator/compositor",
    );
    expect(Object.fromEntries(parsed.searchParams)).toEqual({
      options: "$MTY61,$PN01,$WY18P,$IBB3",
      view: "FRONT34",
      model: "my",
      size: "1440",
      bkba_opt: "1",
      context: "design_studio_2",
      crop: "0,0,0,0",
      overlay: "0",
    });
  });

  test("picks the all-wheel-drive trim for a dual-motor badge", () => {
    expect(optionsOf(carImageUrl({ ...rika, trimBadging: "74d" }))).toBe(
      "$MTY77,$PN01,$WY18P,$IBB3",
    );
    expect(
      optionsOf(
        carImageUrl({
          ...rika,
          wheelType: "Crossflow19",
          exteriorColor: "PearlWhite",
          trimBadging: "74d",
        }),
      ),
    ).toBe("$MTY48,$PPSW,$WY19P,$IPB12");
  });

  test("uses the Performance trim for the 21-inch Arachnid wheels", () => {
    expect(
      optionsOf(
        carImageUrl({
          ...rika,
          wheelType: "Arachnid21",
          exteriorColor: "UltraRed",
          trimBadging: "p74d",
        }),
      ),
    ).toBe("$MTY70,$PR01,$WY21A,$IPB14");
  });

  test("uses the 2020-2024 compositor for the older Model Y wheels", () => {
    const url = carImageUrl({
      ...rika,
      wheelType: "Gemini19",
      exteriorColor: "MidnightSilver",
      trimBadging: "74d",
    });
    const parsed = new URL(url ?? "");
    expect(parsed.pathname).toBe("/v1/compositor/");
    expect(parsed.searchParams.get("options")).toBe(
      "$MTY09,$PMNG,$WY19B,$INPB0",
    );
    expect(parsed.searchParams.get("view")).toBe("STUD_3QTR");
    expect(parsed.searchParams.has("context")).toBe(false);
  });

  test("builds the 2024 Model 3 render", () => {
    expect(
      optionsOf(
        carImageUrl({
          model: "3",
          exteriorColor: "Stealth Grey",
          wheelType: "Prismata18",
          trimBadging: "50",
        }),
      ),
    ).toBe("$MT367,$PN01,$W38C,$IBB4");
  });

  test("gives no image when a field is missing or unknown", () => {
    expect(carImageUrl({ ...rika, model: null })).toBeNull();
    expect(carImageUrl({ ...rika, model: "S" })).toBeNull();
    expect(carImageUrl({ ...rika, wheelType: "Pinwheel18" })).toBeNull();
    expect(carImageUrl({ ...rika, exteriorColor: "SolidBlack" })).toBeNull();
    expect(
      carImageUrl({
        model: null,
        exteriorColor: null,
        wheelType: null,
        trimBadging: null,
      }),
    ).toBeNull();
  });

  test("sets the requested size", () => {
    expect(new URL(carImageUrl(rika, 960) ?? "").searchParams.get("size")).toBe(
      "960",
    );
  });
});
