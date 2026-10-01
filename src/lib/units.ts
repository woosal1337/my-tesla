import type { Preferences } from "./preferences";

const kmPerMile = 1.609344;
const feetPerMeter = 3.280839895;
const psiPerBar = 14.5037738;
const kpaPerBar = 100;

export type UnitLabels = {
  distance: string;
  speed: string;
  temperature: string;
  pressure: string;
  efficiency: string;
  elevation: string;
};

export type UnitSystem = Pick<
  Preferences,
  "distance" | "temperature" | "pressure" | "efficiency"
>;

export function unitLabels(units: UnitSystem): UnitLabels {
  const distance = units.distance === "mi" ? "mi" : "km";
  return {
    distance,
    speed: units.distance === "mi" ? "mph" : "km/h",
    temperature: units.temperature === "f" ? "°F" : "°C",
    pressure: { bar: "bar", psi: "psi", kpa: "kPa" }[units.pressure],
    efficiency: {
      "wh-per-distance": `Wh/${distance}`,
      "kwh-per-100": `kWh/100 ${distance}`,
      "distance-per-kwh": `${distance}/kWh`,
    }[units.efficiency],
    elevation: units.distance === "mi" ? "ft" : "m",
  };
}

export function toDistance(km: number, units: UnitSystem): number {
  return units.distance === "mi" ? km / kmPerMile : km;
}

export function toSpeed(kmh: number, units: UnitSystem): number {
  return toDistance(kmh, units);
}

export function toElevation(meters: number, units: UnitSystem): number {
  return units.distance === "mi" ? meters * feetPerMeter : meters;
}

export function toTemperature(celsius: number, units: UnitSystem): number {
  return units.temperature === "f" ? (celsius * 9) / 5 + 32 : celsius;
}

export function toPressure(bar: number, units: UnitSystem): number {
  if (units.pressure === "psi") return bar * psiPerBar;
  if (units.pressure === "kpa") return bar * kpaPerBar;
  return bar;
}

export function toEfficiency(
  whPerKm: number,
  units: UnitSystem,
): number | null {
  if (!Number.isFinite(whPerKm) || whPerKm <= 0) return null;
  const whPerUnit = units.distance === "mi" ? whPerKm * kmPerMile : whPerKm;
  if (units.efficiency === "kwh-per-100") return whPerUnit / 10;
  if (units.efficiency === "distance-per-kwh") return 1000 / whPerUnit;
  return whPerUnit;
}

export function efficiencyDigits(units: UnitSystem): number {
  return units.efficiency === "wh-per-distance" ? 0 : 1;
}

export function pressureDigits(units: UnitSystem): number {
  return units.pressure === "bar" ? 1 : 0;
}
