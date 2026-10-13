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

  test("shows the dark 19 inch wheels of a 2024 Model Y", () => {
    expect(
      optionsOf(
        carImageUrl({
          model: "Y",
          exteriorColor: "SolidBlack",
          wheelType: "Apollo19MetallicShadow",
          trimBadging: "74D",
        }),
      ),
    ).toBe("$MTY09,$PBSB,$WY19C,$INPB0");
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
    expect(carImageUrl({ ...rika, exteriorColor: "Plaid" })).toBeNull();
    expect(
      carImageUrl({
        model: null,
        exteriorColor: null,
        wheelType: null,
        trimBadging: null,
      }),
    ).toBeNull();
  });

  test.each([
    ["Pinwheel18CapKit", "PearlWhite", "$PPSW,$W38B"],
    ["Stiletto19", "ObsidianBlack", "$PMBL,$W39B"],
    ["Performance20", "RedMulticoat", "$PPMR,$W32P"],
    ["Uberturbine20", "MidnightSilverMetallic", "$PMNG,$W33D"],
  ])(
    "builds the 2017-2023 Model 3 render for %s",
    (wheelType, color, codes) => {
      const url = carImageUrl({
        model: "3",
        exteriorColor: color,
        wheelType,
        trimBadging: "74D",
      });
      expect(new URL(url ?? "").pathname).toBe("/v1/compositor/");
      expect(optionsOf(url)).toBe(codes);
    },
  );

  test.each([
    ["Photon18", "$MT369,$PN01,$W38A,$IPB2"],
    ["Glider18", "$MT369,$PN01,$W38A,$IPB2"],
    ["Helix19", "$MT369,$PN01,$W39G,$IPB2"],
    ["Performance20", "$MT371,$PN01,$W30A,$IPB4"],
  ])("knows the 2024 Model 3 wheel name %s", (wheelType, codes) => {
    expect(
      optionsOf(
        carImageUrl({
          model: "3",
          exteriorColor: "StealthGrey",
          wheelType,
          trimBadging: "50",
        }),
      ),
    ).toBe(codes);
  });

  test("knows the colors that TeslaMate names in another way", () => {
    const juniper = { ...rika, wheelType: "Crossflow19" };
    expect(
      optionsOf(carImageUrl({ ...juniper, exteriorColor: "BlackDiamond" })),
    ).toBe("$MTY60,$PX02,$WY19P,$IPB12");
    expect(
      optionsOf(carImageUrl({ ...juniper, exteriorColor: "GlacierBlue" })),
    ).toBe("$MTY60,$PB01,$WY19P,$IPB12");
    expect(
      optionsOf(carImageUrl({ ...juniper, exteriorColor: "StealthGray" })),
    ).toBe("$MTY60,$PN01,$WY19P,$IPB12");
  });

  test("shows the 2023 colors on the 2020-2024 Model Y", () => {
    expect(
      optionsOf(
        carImageUrl({
          model: "Y",
          exteriorColor: "Quicksilver",
          wheelType: "Induction20",
          trimBadging: "74D",
        }),
      ),
    ).toBe("$MTY09,$PN00,$WY20P,$INPB0");
  });

  test("lets the color pick the generation for a wheel of both", () => {
    const performance = { ...rika, wheelType: "Uberturbine21" };
    expect(
      optionsOf(carImageUrl({ ...performance, exteriorColor: "RedMulticoat" })),
    ).toBe("$MTY12,$PPMR,$WY21P,$INPB0");
    expect(
      optionsOf(carImageUrl({ ...performance, exteriorColor: "MarineBlue" })),
    ).toBe("$MTY70,$PB02,$WY21A,$IPB14");
  });

  test("shows the usual wheels for an unknown wheel when the color names one generation", () => {
    expect(
      optionsOf(
        carImageUrl({
          ...rika,
          exteriorColor: "SolidBlack",
          wheelType: "New22",
        }),
      ),
    ).toBe("$MTY09,$PBSB,$WY19B,$INPB0");
    expect(
      optionsOf(
        carImageUrl({
          model: "3",
          exteriorColor: "UltraRed",
          wheelType: "Pinwheel18CapKit",
          trimBadging: "50",
        }),
      ),
    ).toBe("$MT369,$PR01,$W38A,$IPB2");
    expect(
      optionsOf(
        carImageUrl({ ...rika, exteriorColor: "SolidBlack", wheelType: null }),
      ),
    ).toBe("$MTY09,$PBSB,$WY19B,$INPB0");
  });

  test("gives no image for an unknown wheel when the color fits two generations", () => {
    expect(
      carImageUrl({ ...rika, exteriorColor: "PearlWhite", wheelType: "New22" }),
    ).toBeNull();
    expect(carImageUrl({ ...rika, wheelType: "Pinwheel18" })).toBeNull();
  });

  test("sets the requested size", () => {
    expect(new URL(carImageUrl(rika, 960) ?? "").searchParams.get("size")).toBe(
      "960",
    );
  });
});
