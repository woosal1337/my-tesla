export type CarImageInput = {
  model: string | null;
  exteriorColor: string | null;
  wheelType: string | null;
  trimBadging: string | null;
};

type WheelSpec = {
  wheel: string;
  trim: string;
  trimAwd?: string;
  interior: string;
};

type Profile = {
  base: string;
  model: string;
  view: string;
  modern: boolean;
  paints: Record<string, string>;
  wheels: Record<string, WheelSpec>;
};

const modernPaints = {
  stealthgrey: "$PN01",
  pearlwhite: "$PPSW",
  pearlwhitemulticoat: "$PPSW",
  deepblue: "$PPSB",
  deepbluemetallic: "$PPSB",
  diamondblack: "$PX02",
  ultrared: "$PR01",
  quicksilver: "$PN00",
  quicksilversilver: "$PN00",
};

const legacyPaints = {
  pearlwhite: "$PPSW",
  pearlwhitemulticoat: "$PPSW",
  solidblack: "$PBSB",
  black: "$PBSB",
  midnightsilver: "$PMNG",
  midnightsilvermetallic: "$PMNG",
  deepblue: "$PPSB",
  deepbluemetallic: "$PPSB",
  redmulticoat: "$PPMR",
};

const modernCompositor =
  "https://static-assets.tesla.com/configurator/compositor";

const profiles: Profile[] = [
  {
    base: modernCompositor,
    model: "my",
    view: "FRONT34",
    modern: true,
    paints: modernPaints,
    wheels: {
      aperture18: {
        wheel: "$WY18P",
        trim: "$MTY61",
        trimAwd: "$MTY77",
        interior: "$IBB3",
      },
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
      arachnid21: { wheel: "$WY21A", trim: "$MTY70", interior: "$IPB14" },
    },
  },
  {
    base: "https://static-assets.tesla.com/v1/compositor/",
    model: "my",
    view: "STUD_3QTR",
    modern: false,
    paints: legacyPaints,
    wheels: {
      gemini19: { wheel: "$WY19B", trim: "$MTY09", interior: "$INPB0" },
      induction20: { wheel: "$WY20P", trim: "$MTY09", interior: "$INPB0" },
      uberturbine21: { wheel: "$WY21P", trim: "$MTY12", interior: "$INPB0" },
    },
  },
  {
    base: modernCompositor,
    model: "m3",
    view: "STUD_FRONT34",
    modern: true,
    paints: modernPaints,
    wheels: {
      prismata18: {
        wheel: "$W38C",
        trim: "$MT367",
        trimAwd: "$MT370",
        interior: "$IBB4",
      },
      nova19: {
        wheel: "$W39G",
        trim: "$MT369",
        trimAwd: "$MT370",
        interior: "$IPB2",
      },
      warp20: { wheel: "$W30A", trim: "$MT371", interior: "$IPB4" },
    },
  },
];

const modelCodes: Record<string, string> = { Y: "my", "3": "m3" };

function key(value: string | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isDualMotor(trimBadging: string | null): boolean {
  return /\d+d$/i.test(trimBadging ?? "") || /^p/i.test(trimBadging ?? "");
}

export function carImageUrl(car: CarImageInput, size = 1440): string | null {
  const model = modelCodes[car.model ?? ""];
  if (!model) return null;
  const wheelKey = key(car.wheelType);
  const profile = profiles.find(
    (candidate) => candidate.model === model && wheelKey in candidate.wheels,
  );
  if (!profile) return null;
  const paint = profile.paints[key(car.exteriorColor)];
  if (!paint) return null;
  const spec = profile.wheels[wheelKey];
  const trim =
    spec.trimAwd && isDualMotor(car.trimBadging) ? spec.trimAwd : spec.trim;
  const params = new URLSearchParams({
    options: [trim, paint, spec.wheel, spec.interior].join(","),
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
