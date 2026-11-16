import { describe, expect, test } from "bun:test";
import {
  carImage,
  carImageUrl,
  vinModelYear,
  type CarImageInput,
} from "./car-image";

const rika: CarImageInput = {
  model: "Y",
  exteriorColor: "StealthGrey",
  wheelType: "Aperture18",
  trimBadging: "50",
};

function optionsOf(url: string | null): string | null {
  return url ? new URL(url).searchParams.get("options") : null;
}

function isNewBody(url: string | null): boolean {
  return url
    ? new URL(url).searchParams.get("context") === "design_studio_2"
    : false;
}

describe("vinModelYear", () => {
  test("reads the tenth character of the VIN", () => {
    expect(vinModelYear("S")).toBe(2025);
    expect(vinModelYear("r")).toBe(2024);
    expect(vinModelYear("M")).toBe(2021);
    expect(vinModelYear("L")).toBe(2020);
    expect(vinModelYear("1")).toBe(2031);
    for (const code of ["I", "O", "Q", "U", "Z", "0", "", "SS", null]) {
      expect(vinModelYear(code)).toBeNull();
    }
  });
});

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
    expect(carImageUrl({ ...rika, model: "Roadster" })).toBeNull();
    expect(
      carImageUrl({ ...rika, model: "S", exteriorColor: null }),
    ).toBeNull();
    expect(
      carImageUrl({ ...rika, model: "3", exteriorColor: "GlacierBlue" }),
    ).toBeNull();
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

  test("shows the newest generation with the color for an unknown wheel", () => {
    expect(
      optionsOf(
        carImageUrl({
          ...rika,
          exteriorColor: "PearlWhite",
          wheelType: "New22",
        }),
      ),
    ).toBe("$MTY60,$PPSW,$WY19P,$IPB12");
    expect(optionsOf(carImageUrl({ ...rika, wheelType: "Pinwheel18" }))).toBe(
      "$MTY60,$PN01,$WY19P,$IPB12",
    );
    expect(
      optionsOf(
        carImageUrl({
          model: "S",
          exteriorColor: "SolidBlack",
          wheelType: null,
          trimBadging: null,
        }),
      ),
    ).toBe("$MTS13,$PBSB,$WS90,$IBE00");
  });

  test.each([
    ["Base19", "PearlWhite", "$PPSW,$WT19"],
    ["Slipstream19Carbon", "SolidBlack", "$PBSB,$WT19"],
    ["Turbine19Dark", "MetallicBlack", "$PMBL,$WTAS"],
    ["Arachnid21Grey", "TitaniumCopper", "$PPTI,$WTSG"],
    ["Super21Silver", "MetallicBrown", "$PMAB,$WTSS"],
    ["Silver21Euro", "DolphinGrey", "$PMTG,$WT21"],
    ["TwinTurbine21Carbon", "SignatureRed", "$PPSR,$WTTB"],
    ["Charcoal21", "MetallicGreen", "$PMSG,$WTSG"],
  ])(
    "builds the 2012-2020 Model S render for %s",
    (wheelType, color, codes) => {
      const url = carImageUrl({
        model: "S",
        exteriorColor: color,
        wheelType,
        trimBadging: "85D",
      });
      const parsed = new URL(url ?? "");
      expect(parsed.pathname).toBe("/v1/compositor/");
      expect(parsed.searchParams.get("model")).toBe("ms");
      expect(parsed.searchParams.get("view")).toBe("STUD_3QTR");
      expect(optionsOf(url)).toBe(codes);
    },
  );

  test.each([
    ["Cardenio19", "SolidBlack", "$MTS13,$PBSB,$WS90,$IBE00"],
    ["Tempest19", "LunarSilver", "$MTS13,$PN02,$WS90,$IBE00"],
    ["Arachnid21", "UltraRed", "$MTS13,$PR01,$WS11,$IBE00"],
    [null, "DiamondBlack", "$MTS22,$PX02,$WS93,$IBE01"],
    [null, "FrostBlue", "$MTS22,$PB00,$WS93,$IBE01"],
  ])(
    "builds the Model S render from 2021 for %s in %s",
    (wheelType, color, codes) => {
      const url = carImageUrl({
        model: "S",
        exteriorColor: color,
        wheelType,
        trimBadging: "100D",
      });
      const parsed = new URL(url ?? "");
      expect(parsed.pathname).toBe("/configurator/compositor");
      expect(parsed.searchParams.get("model")).toBe("ms");
      expect(parsed.searchParams.get("view")).toBe("FRONT34");
      expect(optionsOf(url)).toBe(codes);
    },
  );

  test.each([
    ["AeroTurbine20", "PearlWhite", "/v1/compositor/", "$PPSW,$WT20"],
    ["Slipstream20Carbon", "SteelGrey", "/v1/compositor/", "$PMNG,$WTSC"],
    ["Slipstream20Silver", "SilverMetallic", "/v1/compositor/", "$PMSS,$WT20"],
    ["Turbine22", "SolidWhite", "/v1/compositor/", "$PBCW,$WT22"],
    ["Turbine22Dark", "MetallicBlack", "/v1/compositor/", "$PMBL,$WTUT"],
    [
      "Cyberstream20",
      "RedMulticoat",
      "/configurator/compositor",
      "$MTX10,$PPMR,$WX00,$IBE00",
    ],
    [
      "NewTurbine22Black",
      "DeepBlue",
      "/configurator/compositor",
      "$MTX10,$PPSB,$WX20,$IBE00",
    ],
    [
      "NewTurbine22Black",
      "StealthGrey",
      "/configurator/compositor",
      "$MTX22,$PN01,$WX02,$IBE01",
    ],
  ])(
    "builds the Model X render for %s in %s",
    (wheelType, color, path, codes) => {
      const url = carImageUrl({
        model: "X",
        exteriorColor: color,
        wheelType,
        trimBadging: "P100D",
      });
      const parsed = new URL(url ?? "");
      expect(parsed.pathname).toBe(path);
      expect(parsed.searchParams.get("model")).toBe("mx");
      expect(optionsOf(url)).toBe(codes);
    },
  );

  test("shows the stainless Cybertruck whatever the color and wheel", () => {
    for (const exteriorColor of [null, "Stainless", "SatinBlack"]) {
      const url = carImageUrl({
        model: "Cybertruck",
        exteriorColor,
        wheelType: "CybertruckPremium",
        trimBadging: "AWD",
      });
      const parsed = new URL(url ?? "");
      expect(parsed.pathname).toBe("/configurator/compositor");
      expect(parsed.searchParams.get("model")).toBe("ct");
      expect(parsed.searchParams.get("view")).toBe("FRONT34");
      expect(optionsOf(url)).toBe("$MTC03,$PDD,$WH0B,$IG01");
    }
  });

  test.each([
    ["PinwheelRefresh18", "$PPSW,$W40B"],
    ["Sportwheel19", "$PPSW,$W39B"],
    ["StilettoRefresh19", "$PPSW,$W41B"],
    ["Stiletto20DarkSquare", "$PPSW,$W32D"],
    ["Performancewheel20", "$PPSW,$W32P"],
    ["ZeroG20Gunpowder", "$PPSW,$W33D"],
  ])("knows the 2017-2023 Model 3 wheel name %s", (wheelType, codes) => {
    expect(
      optionsOf(
        carImageUrl({
          model: "3",
          exteriorColor: "PearlWhite",
          wheelType,
          trimBadging: "74D",
        }),
      ),
    ).toBe(codes);
  });

  test("shows a Marine Blue Model 3 from 2024", () => {
    expect(
      optionsOf(
        carImageUrl({
          model: "3",
          exteriorColor: "MarineBlue",
          wheelType: "Glider18",
          trimBadging: "50",
        }),
      ),
    ).toBe("$MT369,$PB02,$W38A,$IPB2");
  });

  test("sets the requested size", () => {
    expect(new URL(carImageUrl(rika, 960) ?? "").searchParams.get("size")).toBe(
      "960",
    );
  });

  test("lets the model year rule out a generation that did not exist", () => {
    const model3 = {
      model: "3",
      exteriorColor: "PearlWhite",
      wheelType: "Performance20",
      trimBadging: "P74D",
    };
    expect(isNewBody(carImageUrl(model3))).toBe(false);
    expect(isNewBody(carImageUrl({ ...model3, modelYear: 2022 }))).toBe(false);
    expect(isNewBody(carImageUrl({ ...model3, modelYear: 2024 }))).toBe(true);
    const capKit = {
      ...model3,
      wheelType: "Pinwheel18CapKit",
      trimBadging: "50",
    };
    expect(isNewBody(carImageUrl(capKit))).toBe(false);
    expect(isNewBody(carImageUrl({ ...capKit, modelYear: 2025 }))).toBe(true);
    const modelY = {
      ...rika,
      exteriorColor: "PearlWhite",
      wheelType: "Uberturbine21",
    };
    expect(isNewBody(carImageUrl({ ...modelY, modelYear: 2025 }))).toBe(
      isNewBody(carImageUrl(modelY)),
    );
    expect(isNewBody(carImageUrl({ ...modelY, modelYear: 2026 }))).toBe(true);
    expect(isNewBody(carImageUrl({ ...modelY, modelYear: 2021 }))).toBe(false);
  });
});

function generation(
  model: string,
  exteriorColor: string,
  wheelType: string | null,
  trimBadging: string | null,
  modelYear: number,
): CarImageInput {
  return { model, exteriorColor, wheelType, trimBadging, modelYear };
}

const generations = {
  legacyY: generation("Y", "PearlWhite", "Gemini19", "74D", 2022),
  juniper: generation("Y", "StealthGrey", "Crossflow19", "74D", 2026),
  legacy3: generation("3", "PearlWhite", "Pinwheel18CapKit", "50", 2021),
  highland: generation("3", "StealthGrey", "Photon18", "50", 2024),
  classicS: generation("S", "PearlWhite", "Slipstream19Silver", "100D", 2018),
  refreshS: generation("S", "PearlWhite", "Tempest19", "100D", 2022),
  newestS: generation("S", "FrostBlue", null, null, 2026),
  classicX: generation("X", "PearlWhite", "AeroTurbine20", "100D", 2018),
  refreshX: generation("X", "PearlWhite", "Cyberstream20", null, 2022),
  newestX: generation("X", "FrostBlue", null, null, 2026),
  cybertruck: generation("Cybertruck", "StainlessSteel", null, null, 2024),
};

describe("carImage", () => {
  test("gives the URL of carImageUrl and the place of the 2025 Model Y", () => {
    const image = carImage(rika);
    expect(image?.url).toBe(carImageUrl(rika) ?? "");
    expect(image?.frame).toEqual({
      left: 0.227,
      top: 0.275,
      width: 0.558,
      height: 0.422,
    });
  });

  test("keeps the car of every generation inside the image", () => {
    for (const [name, car] of Object.entries(generations)) {
      const frame = carImage(car)?.frame;
      expect(frame, name).toBeDefined();
      if (!frame) continue;
      const values = [frame.left, frame.top, frame.width, frame.height];
      expect(values.every(Number.isFinite), name).toBe(true);
      expect(frame.width, name).toBeGreaterThanOrEqual(0.4);
      expect(frame.width, name).toBeLessThanOrEqual(0.75);
      expect(frame.left + frame.width, name).toBeLessThanOrEqual(1);
      expect(frame.top + frame.height, name).toBeLessThanOrEqual(1);
    }
  });

  test("measures each generation on its own", () => {
    expect(carImage(generations.legacy3)?.frame).not.toEqual(
      carImage(generations.classicX)?.frame,
    );
  });

  test("gives no image for a car without a render", () => {
    expect(carImage({ ...rika, model: "Roadster" })).toBeNull();
    expect(carImage({ ...rika, exteriorColor: "Plaid" })).toBeNull();
  });
});
