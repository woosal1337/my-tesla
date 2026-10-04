import type { CsvValue } from "./csv";
import { dayWindow } from "./insights";
import { localParts } from "./date-format";
import type { Formatter } from "./format";
import type { Charge, Drive } from "./queries";

export type ExportRange = { start: Date; end: Date } | null;

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function localStamp(date: Date | null, timeZone: string): string | null {
  if (!date) return null;
  const parts = localParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function exportRange(
  from: string | null,
  to: string | null,
  timeZone: string,
): ExportRange | "invalid" {
  if (!from && !to) return null;
  if ((from && !dayPattern.test(from)) || (to && !dayPattern.test(to))) {
    return "invalid";
  }
  const start = from ? dayWindow(from, timeZone).start : new Date(0);
  const end = to ? dayWindow(to, timeZone).end : new Date(8.64e15);
  return start < end ? { start, end } : "invalid";
}

function round(value: number | null, digits: number): number | null {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function driveHeader(f: Formatter): string[] {
  const units = f.units;
  return [
    "Start",
    "End",
    "From",
    "To",
    `Distance (${units.distance})`,
    "Duration (min)",
    `Consumption (${units.efficiency})`,
    "Battery start (%)",
    "Battery end (%)",
    `Top speed (${units.speed})`,
    `Outside (${units.temperature})`,
    `Climb (${units.elevation})`,
    `Descent (${units.elevation})`,
  ];
}

export function driveRow(drive: Drive, f: Formatter): CsvValue[] {
  return [
    localStamp(drive.startAt, f.timeZone),
    localStamp(drive.endAt, f.timeZone),
    drive.from,
    drive.to,
    round(f.distanceValue(drive.distanceKm), 2),
    drive.durationMin,
    round(f.efficiencyValue(drive.efficiencyWhPerKm), 2),
    drive.startLevel,
    drive.endLevel,
    round(f.speedValue(drive.speedMaxKmh), 0),
    round(f.temperatureValue(drive.outsideTempAvg), 1),
    round(f.elevationValue(drive.ascentM), 0),
    round(f.elevationValue(drive.descentM), 0),
  ];
}

export function chargeHeader(currency: string | null): string[] {
  return [
    "Start",
    "End",
    "Place",
    "Type",
    "Energy added (kWh)",
    "Battery start (%)",
    "Battery end (%)",
    "Duration (min)",
    "Peak power (kW)",
    currency ? `Cost (${currency})` : "Cost",
    "Cost source",
  ];
}

function costSource(charge: Charge): string | null {
  if (charge.cost === null) return null;
  return charge.costEstimated ? "Estimate" : "TeslaMate";
}

export function chargeRow(charge: Charge, timeZone: string): CsvValue[] {
  return [
    localStamp(charge.startAt, timeZone),
    localStamp(charge.endAt, timeZone),
    charge.place,
    charge.fastCharger ? "DC" : "AC",
    round(charge.energyAddedKwh, 2),
    charge.startLevel,
    charge.endLevel,
    charge.durationMin,
    round(charge.maxPowerKw, 1),
    round(charge.cost, 2),
    costSource(charge),
  ];
}

export function csvFileName(
  kind: "drives" | "charges",
  carName: string,
  now: Date,
): string {
  const slug =
    carName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "car";
  return `my-tesla-${slug}-${kind}-${now.toISOString().slice(0, 10)}.csv`;
}
