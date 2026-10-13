export type CarImageInput = {
  model: string | null;
  exteriorColor: string | null;
  wheelType: string | null;
  trimBadging: string | null;
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
  view: string;
  modern: boolean;
  paints: string[];
  wheels: Record<string, WheelSpec>;
  usualWheel: string;
};

const paintCodes: Record<string, string> = {
  white: "$PPSW",
  pearlwhite: "$PPSW",
  pearlwhitemulticoat: "$PPSW",
  black: "$PBSB",
  solidblack: "$PBSB",
  midnightsilver: "$PMNG",
  midnightsilvermetallic: "$PMNG",
  steelgrey: "$PMNG",
  blue: "$PPSB",
  deepblue: "$PPSB",
  deepbluemetallic: "$PPSB",
  red: "$PPMR",
  redmulticoat: "$PPMR",
  obsidianblack: "$PMBL",
  silver: "$PMSS",
  silvermetallic: "$PMSS",
  quicksilver: "$PN00",
  quicksilversilver: "$PN00",
  stealthgrey: "$PN01",
  stealthgray: "$PN01",
  midnightcherryred: "$PR00",
  ultrared: "$PR01",
  diamondblack: "$PX02",
  blackdiamond: "$PX02",
  glacierblue: "$PB01",
  marineblue: "$PB02",
};

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
const arachnid21 = { wheel: "$WY21A", trim: "$MTY70", interior: "$IPB14" };
const photon18 = { wheel: "$W38A", trim: "$MT369", interior: "$IPB2" };
const nova19 = {
  wheel: "$W39G",
  trim: "$MT369",
  trimAwd: "$MT370",
  interior: "$IPB2",
};
const warp20 = { wheel: "$W30A", trim: "$MT371", interior: "$IPB4" };

const profiles: Profile[] = [
  {
    base: olderCompositor,
    model: "my",
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
    usualWheel: "gemini19",
  },
  {
    base: modernCompositor,
    model: "my",
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
      crossflow19: {
        wheel: "$WY19P",
        trim: "$MTY60",
        trimAwd: "$MTY48",
        interior: "$IPB12",
      },
      helix20: {
        wheel: "$WY20B",
        trim: "$MTY60",
        trimAwd: "$MTY48",
        interior: "$IPB12",
      },
      arachnid21,
      uberturbine21: arachnid21,
    },
    usualWheel: "crossflow19",
  },
  {
    base: olderCompositor,
    model: "m3",
    view: "STUD_3QTR",
    modern: false,
    paints: ["$PPSW", "$PBSB", "$PMNG", "$PPSB", "$PPMR", "$PMBL", "$PMSS"],
    wheels: {
      pinwheel18: { wheel: "$W38B" },
      stiletto19: { wheel: "$W39B" },
      sport19: { wheel: "$W39B" },
      stiletto20: { wheel: "$W32P" },
      performance20: { wheel: "$W32P" },
      uberturbine20: { wheel: "$W33D" },
    },
    usualWheel: "pinwheel18",
  },
  {
    base: modernCompositor,
    model: "m3",
    view: "STUD_FRONT34",
    modern: true,
    paints: ["$PN01", "$PPSW", "$PPSB", "$PBSB", "$PR01", "$PN00", "$PX02"],
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
    usualWheel: "photon18",
  },
];

const modelCodes: Record<string, string> = { Y: "my", "3": "m3" };

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

function pick(
  model: string,
  paint: string,
  wheelKey: string,
): { profile: Profile; spec: WheelSpec } | null {
  const painted = profiles.filter(
    (profile) => profile.model === model && profile.paints.includes(paint),
  );
  for (const profile of painted) {
    const spec = wheelOf(profile, wheelKey);
    if (spec) return { profile, spec };
  }
  if (painted.length !== 1) return null;
  const [profile] = painted;
  return { profile, spec: profile.wheels[profile.usualWheel] };
}

export function carImageUrl(car: CarImageInput, size = 1440): string | null {
  const model = modelCodes[car.model ?? ""];
  const paint = paintCodes[key(car.exteriorColor)];
  if (!model || !paint) return null;
  const picked = pick(model, paint, key(car.wheelType));
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
  return `${profile.base}?${params}`;
}
