export type RecordedState = "online" | "offline" | "asleep";

export type CarActivity =
  "driving" | "charging" | "online" | "asleep" | "offline" | "unknown";

export type Tone = "active" | "charge" | "quiet";

export const ongoingText = "Ongoing…";

export const tabs = [
  { id: "overview", label: "Overview", segment: "" },
  { id: "drives", label: "Drives", segment: "/drives" },
  { id: "charging", label: "Charging", segment: "/charging" },
  { id: "battery", label: "Battery", segment: "/battery" },
  { id: "stats", label: "Stats", segment: "/stats" },
  { id: "places", label: "Places", segment: "/places" },
  { id: "settings", label: "Settings", segment: "/settings" },
] as const;

export type TabId = (typeof tabs)[number]["id"];

const modelNames: Record<string, string> = {
  "3": "Model 3",
  S: "Model S",
  X: "Model X",
  Y: "Model Y",
};

export function modelName(model: string | null | undefined): string {
  if (!model) return "Tesla";
  return modelNames[model] ?? `Model ${model}`;
}

export function colorName(code: string | null | undefined): string | null {
  if (!code) return null;
  return code
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

export function variantLine(car: {
  model: string | null;
  marketingName: string | null;
  exteriorColor: string | null;
}): string {
  const model = [modelName(car.model), car.marketingName]
    .filter(Boolean)
    .join(" ");
  return [model, colorName(car.exteriorColor)].filter(Boolean).join(" · ");
}

export function carActivity(input: {
  state: RecordedState | null;
  driving: boolean;
  charging: boolean;
}): CarActivity {
  if (input.driving) return "driving";
  if (input.charging) return "charging";
  return input.state ?? "unknown";
}

const liveActivities: Record<string, CarActivity> = {
  driving: "driving",
  charging: "charging",
  online: "online",
  updating: "online",
  suspended: "online",
  asleep: "asleep",
  offline: "offline",
};

export function liveActivity(state: string | null): CarActivity | null {
  return state === null ? null : (liveActivities[state] ?? null);
}

const activityLabels: Record<CarActivity, { label: string; tone: Tone }> = {
  driving: { label: "Driving", tone: "active" },
  charging: { label: "Charging", tone: "charge" },
  online: { label: "Online", tone: "active" },
  asleep: { label: "Asleep", tone: "quiet" },
  offline: { label: "Offline", tone: "quiet" },
  unknown: { label: "No data yet", tone: "quiet" },
};

export function activityLabel(activity: CarActivity): {
  label: string;
  tone: Tone;
} {
  return activityLabels[activity];
}

export function batteryTone(
  level: number | null,
  charging: boolean,
): "charge" | "low" | "normal" {
  if (charging) return "charge";
  if (level !== null && level <= 20) return "low";
  return "normal";
}

const coldBatteryGap = 3;

export function batteryCaption(input: {
  level: number | null;
  usableLevel: number | null;
  charging: boolean;
}): string {
  if (input.charging) return "Charging";
  if (
    input.level !== null &&
    input.usableLevel !== null &&
    input.level - input.usableLevel >= coldBatteryGap
  ) {
    return `${input.usableLevel}% usable, the battery is cold`;
  }
  return "Rated range";
}

export function driveEfficiency(drive: {
  startRangeKm: number | null;
  endRangeKm: number | null;
  distanceKm: number | null;
  carEfficiencyKwhPerKm: number | null;
}): number | null {
  const { startRangeKm, endRangeKm, distanceKm, carEfficiencyKwhPerKm } = drive;
  if (
    startRangeKm === null ||
    endRangeKm === null ||
    distanceKm === null ||
    carEfficiencyKwhPerKm === null ||
    distanceKm < 0.5
  ) {
    return null;
  }
  const energyKwh = (startRangeKm - endRangeKm) * carEfficiencyKwhPerKm;
  if (energyKwh <= 0) return null;
  return (energyKwh * 1000) / distanceKm;
}

export function tabDirection(
  from: TabId,
  to: TabId,
): "tab-forward" | "tab-back" | null {
  const fromIndex = tabs.findIndex((tab) => tab.id === from);
  const toIndex = tabs.findIndex((tab) => tab.id === to);
  if (fromIndex === toIndex) return null;
  return toIndex > fromIndex ? "tab-forward" : "tab-back";
}

export function tabFromPath(pathname: string, carId: number): TabId {
  const base = `/cars/${carId}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : "";
  const match = tabs.find(
    (tab) =>
      tab.segment &&
      (rest === tab.segment || rest.startsWith(`${tab.segment}/`)),
  );
  return match?.id ?? "overview";
}

export type PlaceParts = {
  geofence: string | null;
  name: string | null;
  road: string | null;
  houseNumber: string | null;
  city: string | null;
};

export type PlaceStyle = {
  placeNames: "geofence" | "address";
  addressDetail: "full" | "street" | "city";
};

const fullPlaceStyle: PlaceStyle = {
  placeNames: "geofence",
  addressDetail: "full",
};

export function placeLabel(
  place: PlaceParts,
  style: PlaceStyle = fullPlaceStyle,
): string {
  if (style.placeNames === "geofence" && place.geofence) return place.geofence;
  if (style.addressDetail === "city") {
    return place.city || place.name || place.road || "Unknown place";
  }
  if (style.addressDetail === "street") {
    return place.road || place.name || place.city || "Unknown place";
  }
  if (place.name) return place.name;
  const street = [place.road, place.houseNumber].filter(Boolean).join(" ");
  if (street && place.city) return `${street}, ${place.city}`;
  return street || place.city || "Unknown place";
}
