import type { CarImageFrame } from "./app/contract";

export type CarImageInput = {
  model: string | null;
  exteriorColor: string | null;
  wheelType: string | null;
  trimBadging: string | null;
  modelYear?: number | null;
};

type WheelSpec = {
  wheel: string;
  trim?: string;
  trimAwd?: string;
  interior?: string;
};

type Profile = {
  base: string;
  model: string;
  years: [number, number | null];
  view: string;
  modern: boolean;
  paints: string[];
  wheels: Record<string, WheelSpec>;
  usualWheel: WheelSpec;
  frame: CarImageFrame;
};

const paintCodes: Record<string, string> = {
  white: "$PPSW",
  pearl: "$PPSW",
  pearlwhite: "$PPSW",
  pearlwhitemulticoat: "$PPSW",
  solidwhite: "$PBCW",
  black: "$PBSB",
  solidblack: "$PBSB",
  midnightsilver: "$PMNG",
  midnightsilvermetallic: "$PMNG",
  steelgrey: "$PMNG",
  blue: "$PPSB",
  deepblue: "$PPSB",
  deepbluemetallic: "$PPSB",
  signatureblue: "$PPSB",
  metallicblue: "$PMMB",
  red: "$PPMR",
  redmulticoat: "$PPMR",
  signaturered: "$PPSR",
  obsidianblack: "$PMBL",
  metallicblack: "$PMBL",
  silver: "$PMSS",
  silvermetallic: "$PMSS",
  brown: "$PMAB",
  metallicbrown: "$PMAB",
  titaniumcopper: "$PPTI",
  dolphingrey: "$PMTG",
  green: "$PMSG",
  metallicgreen: "$PMSG",
  quicksilver: "$PN00",
  quicksilversilver: "$PN00",
  stealthgrey: "$PN01",
  stealthgray: "$PN01",
  lunarsilver: "$PN02",
  midnightcherryred: "$PR00",
  ultrared: "$PR01",
  diamondblack: "$PX02",
  blackdiamond: "$PX02",
  frostblue: "$PB00",
  glacierblue: "$PB01",
  marineblue: "$PB02",
};

const unpaintedBodies: Record<string, string> = { ct: "$PDD" };

const olderCompositor = "https://static-assets.tesla.com/v1/compositor/";
const modernCompositor =
  "https://static-assets.tesla.com/configurator/compositor";

const gemini19 = { wheel: "$WY19B", trim: "$MTY09", interior: "$INPB0" };
const aperture18 = {
  wheel: "$WY18P",
  trim: "$MTY61",
  trimAwd: "$MTY77",
  interior: "$IBB3",
};
const crossflow19 = {
  wheel: "$WY19P",
  trim: "$MTY60",
  trimAwd: "$MTY48",
  interior: "$IPB12",
};
const arachnid21 = { wheel: "$WY21A", trim: "$MTY70", interior: "$IPB14" };
const aero18 = { wheel: "$W38B" };
const sport19 = { wheel: "$W39B" };
const performance20 = { wheel: "$W32P" };
const photon18 = { wheel: "$W38A", trim: "$MT369", interior: "$IPB2" };
const nova19 = {
  wheel: "$W39G",
  trim: "$MT369",
  trimAwd: "$MT370",
  interior: "$IPB2",
};
const warp20 = { wheel: "$W30A", trim: "$MT371", interior: "$IPB4" };
const tempest19 = { wheel: "$WS90", trim: "$MTS13", interior: "$IBE00" };
const cyberstream20 = { wheel: "$WX00", trim: "$MTX10", interior: "$IBE00" };
const classicS = {
  slipstream19: { wheel: "$WT19" },
  aeroturbine19: { wheel: "$WTAS" },
  turbine21: { wheel: "$WTSG" },
};
const classicX = {
  aeroturbine20: { wheel: "$WT20" },
  aeroturbine22: { wheel: "$WT22" },
  onyx22: { wheel: "$WTUT" },
};

const profiles: Profile[] = [
  {
    base: olderCompositor,
    model: "my",
    years: [2020, 2025],
    view: "STUD_3QTR",
    modern: false,
    paints: [
      "$PPSW",
      "$PBSB",
      "$PMNG",
      "$PPSB",
      "$PPMR",
      "$PN00",
      "$PN01",
      "$PR00",
      "$PR01",
    ],
    wheels: {
      gemini19,
      apollo19: gemini19,
      apollo19metallicshadow: { ...gemini19, wheel: "$WY19C" },
      induction20: { ...gemini19, wheel: "$WY20P" },
      uberturbine21: { wheel: "$WY21P", trim: "$MTY12", interior: "$INPB0" },
    },
    usualWheel: gemini19,
    frame: { left: 0.234, top: 0.281, width: 0.535, height: 0.416 },
  },
  {
    base: modernCompositor,
    model: "my",
    years: [2025, null],
    view: "FRONT34",
    modern: true,
    paints: [
      "$PN01",
      "$PPSW",
      "$PX02",
      "$PN00",
      "$PR01",
      "$PB01",
      "$PB02",
      "$PPSB",
    ],
    wheels: {
      aperture18,
      photon18: aperture18,
      crossflow19,
      helix20: { ...crossflow19, wheel: "$WY20B" },
      arachnid21,
      uberturbine21: arachnid21,
    },
    usualWheel: crossflow19,
    frame: { left: 0.227, top: 0.275, width: 0.558, height: 0.422 },
  },
  {
    base: olderCompositor,
    model: "m3",
    years: [2017, 2023],
    view: "STUD_3QTR",
    modern: false,
    paints: ["$PPSW", "$PBSB", "$PMNG", "$PPSB", "$PPMR", "$PMBL", "$PMSS"],
    wheels: {
      pinwheel18: aero18,
      aero18,
      pinwheelrefresh18: { wheel: "$W40B" },
      stiletto19: sport19,
      sport19,
      sportwheel19: sport19,
      aeroturbine19: sport19,
      gemini19: sport19,
      stilettorefresh19: { wheel: "$W41B" },
      stiletto20: performance20,
      stiletto20dark: { wheel: "$W32D" },
      performance20,
      performancewheel20: performance20,
      uberturbine20: { wheel: "$W33D" },
      zerog20: { wheel: "$W33D" },
    },
    usualWheel: aero18,
    frame: { left: 0.144, top: 0.294, width: 0.688, height: 0.446 },
  },
  {
    base: modernCompositor,
    model: "m3",
    years: [2024, null],
    view: "STUD_FRONT34",
    modern: true,
    paints: [
      "$PN01",
      "$PPSW",
      "$PPSB",
      "$PBSB",
      "$PR01",
      "$PN00",
      "$PX02",
      "$PB02",
    ],
    wheels: {
      prismata18: {
        wheel: "$W38C",
        trim: "$MT367",
        trimAwd: "$MT370",
        interior: "$IBB4",
      },
      photon18,
      glider18: photon18,
      nova18: photon18,
      nova19,
      helix19: nova19,
      warp20,
      performance20: warp20,
    },
    usualWheel: photon18,
    frame: { left: 0.242, top: 0.325, width: 0.523, height: 0.37 },
  },
  {
    base: olderCompositor,
    model: "ms",
    years: [2012, 2020],
    view: "STUD_3QTR",
    modern: false,
    paints: [
      "$PPSW",
      "$PBCW",
      "$PBSB",
      "$PMBL",
      "$PMNG",
      "$PMSS",
      "$PMTG",
      "$PPTI",
      "$PMAB",
      "$PMSG",
      "$PPSB",
      "$PMMB",
      "$PPMR",
      "$PPSR",
    ],
    wheels: {
      base19: classicS.slipstream19,
      slipstream19: classicS.slipstream19,
      aero19: classicS.aeroturbine19,
      aeroturbine19: classicS.aeroturbine19,
      turbine19: classicS.aeroturbine19,
      arachnid21grey: classicS.turbine21,
      arachnid21black: classicS.turbine21,
      arachnid21silver: classicS.aeroturbine19,
      super21gray: classicS.turbine21,
      super21silver: { wheel: "$WTSS" },
      silver21: { wheel: "$WT21" },
      charcoal21: classicS.turbine21,
      twinturbine21: { wheel: "$WTTB" },
    },
    usualWheel: classicS.slipstream19,
    frame: { left: 0.203, top: 0.184, width: 0.59, height: 0.559 },
  },
  {
    base: modernCompositor,
    model: "ms",
    years: [2021, 2025],
    view: "FRONT34",
    modern: true,
    paints: [
      "$PPSW",
      "$PBSB",
      "$PMNG",
      "$PPSB",
      "$PPMR",
      "$PN01",
      "$PR01",
      "$PN02",
    ],
    wheels: {
      cardenio19: tempest19,
      tempest19,
      arachnid21: { ...tempest19, wheel: "$WS11" },
    },
    usualWheel: tempest19,
    frame: { left: 0.222, top: 0.33, width: 0.556, height: 0.37 },
  },
  {
    base: modernCompositor,
    model: "ms",
    years: [2025, null],
    view: "FRONT34",
    modern: true,
    paints: ["$PN01", "$PPSW", "$PX02", "$PB00", "$PR01", "$PN02"],
    wheels: {},
    usualWheel: { wheel: "$WS93", trim: "$MTS22", interior: "$IBE01" },
    frame: { left: 0.222, top: 0.33, width: 0.556, height: 0.37 },
  },
  {
    base: olderCompositor,
    model: "mx",
    years: [2016, 2020],
    view: "STUD_3QTR",
    modern: false,
    paints: [
      "$PPSW",
      "$PBCW",
      "$PBSB",
      "$PMBL",
      "$PMNG",
      "$PMSS",
      "$PPSB",
      "$PPMR",
    ],
    wheels: {
      aeroturbine20: classicX.aeroturbine20,
      slipstream20: { wheel: "$WTSC" },
      slipstream20silver: classicX.aeroturbine20,
      aeroturbine22: classicX.aeroturbine22,
      turbine22: classicX.aeroturbine22,
      turbine22dark: classicX.onyx22,
      onyx22black: classicX.onyx22,
    },
    usualWheel: classicX.aeroturbine20,
    frame: { left: 0.265, top: 0.285, width: 0.453, height: 0.406 },
  },
  {
    base: modernCompositor,
    model: "mx",
    years: [2021, 2025],
    view: "FRONT34",
    modern: true,
    paints: ["$PPSW", "$PBSB", "$PMNG", "$PPSB", "$PPMR"],
    wheels: {
      cyberstream20,
      newturbine22: { ...cyberstream20, wheel: "$WX20" },
    },
    usualWheel: cyberstream20,
    frame: { left: 0.217, top: 0.275, width: 0.566, height: 0.425 },
  },
  {
    base: modernCompositor,
    model: "mx",
    years: [2025, null],
    view: "FRONT34",
    modern: true,
    paints: ["$PN01", "$PPSW", "$PX02", "$PB00", "$PR01", "$PN02"],
    wheels: {},
    usualWheel: { wheel: "$WX02", trim: "$MTX22", interior: "$IBE01" },
    frame: { left: 0.217, top: 0.275, width: 0.566, height: 0.427 },
  },
  {
    base: modernCompositor,
    model: "ct",
    years: [2024, null],
    view: "FRONT34",
    modern: true,
    paints: ["$PDD"],
    wheels: {},
    usualWheel: { wheel: "$WH0B", trim: "$MTC03", interior: "$IG01" },
    frame: { left: 0.187, top: 0.258, width: 0.637, height: 0.501 },
  },
];

const modelCodes: Record<string, string> = {
  Y: "my",
  "3": "m3",
  S: "ms",
  X: "mx",
  Cybertruck: "ct",
};

function key(value: string | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isDualMotor(trimBadging: string | null): boolean {
  return /\d+d$/i.test(trimBadging ?? "") || /^p/i.test(trimBadging ?? "");
}

function wheelOf(profile: Profile, wheelKey: string): WheelSpec | null {
  const name = Object.keys(profile.wheels)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => wheelKey.startsWith(candidate));
  return name ? profile.wheels[name] : null;
}

function builtIn(profile: Profile, year: number): boolean {
  const [first, last] = profile.years;
  return first <= year && (last === null || year <= last);
}

function pick(
  model: string,
  paint: string,
  wheelKey: string,
  year: number | null,
): { profile: Profile; spec: WheelSpec } | null {
  const colored = profiles.filter(
    (profile) => profile.model === model && profile.paints.includes(paint),
  );
  const ofYear =
    year === null ? [] : colored.filter((profile) => builtIn(profile, year));
  const painted = ofYear.length > 0 ? ofYear : colored;
  for (const profile of painted) {
    const spec = wheelOf(profile, wheelKey);
    if (spec) return { profile, spec };
  }
  const newest = painted.at(-1);
  return newest ? { profile: newest, spec: newest.usualWheel } : null;
}

export function carImage(
  car: CarImageInput,
  size = 1440,
): { url: string; frame: CarImageFrame } | null {
  const model = modelCodes[car.model ?? ""];
  if (!model) return null;
  const paint = unpaintedBodies[model] ?? paintCodes[key(car.exteriorColor)];
  if (!paint) return null;
  const picked = pick(model, paint, key(car.wheelType), car.modelYear ?? null);
  if (!picked) return null;
  const { profile, spec } = picked;
  const trim =
    spec.trimAwd && isDualMotor(car.trimBadging) ? spec.trimAwd : spec.trim;
  const params = new URLSearchParams({
    options: [trim, paint, spec.wheel, spec.interior]
      .filter((code) => code !== undefined)
      .join(","),
    view: profile.view,
    model: profile.model,
    size: String(size),
    bkba_opt: "1",
  });
  if (profile.modern) {
    params.set("context", "design_studio_2");
    params.set("crop", "0,0,0,0");
    params.set("overlay", "0");
  }
  return { url: `${profile.base}?${params}`, frame: profile.frame };
}

export function carImageUrl(car: CarImageInput, size = 1440): string | null {
  return carImage(car, size)?.url ?? null;
}

const yearCodes = "ABCDEFGHJKLMNPRSTVWXY";

export function vinModelYear(code: string | null): number | null {
  if (!code || code.length !== 1) return null;
  const letter = yearCodes.indexOf(code.toUpperCase());
  if (letter >= 0) return 2010 + letter;
  return /^[1-9]$/.test(code) ? 2030 + Number(code) : null;
}
