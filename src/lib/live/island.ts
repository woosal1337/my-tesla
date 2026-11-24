import type { LiveIcon, LiveTone } from "../app/contract";
import type { Formatter } from "../format";
import { gearTitles, updateTitles } from "./tiles";
import { updatePhase, type LiveView } from "./view";

export type IslandActivity = {
  key: "driving" | "charging" | "software";
  icon: LiveIcon;
  title: string;
  value: string | null;
  tone: LiveTone;
  progress: number | null;
  fullAt: Date | null;
};

const chargingStates = new Set(["Charging", "Starting"]);

export function islandActivity(
  view: LiveView,
  f: Formatter,
): IslandActivity | null {
  if (view.driving) {
    return {
      key: "driving",
      icon: "gauge",
      title: gearTitles[view.driving.gear] ?? "Driving",
      value:
        view.driving.speedKmh === null ? null : f.speed(view.driving.speedKmh),
      tone: "active",
      progress: null,
      fullAt: null,
    };
  }
  const charge = view.charging;
  if (charge.state !== null && chargingStates.has(charge.state)) {
    return {
      key: "charging",
      icon: "plug-zap",
      title: "Charging",
      value: charge.powerKw === null ? null : `${f.number(charge.powerKw)} kW`,
      tone: "charge",
      progress: null,
      fullAt: charge.fullAt,
    };
  }
  const phase = updatePhase(view.software);
  if (phase.kind === "current") return null;
  const percent = phase.kind === "ready" ? null : phase.percent;
  return {
    key: "software",
    icon: "download",
    title: updateTitles[phase.kind],
    value:
      percent === null
        ? view.software.updateVersion
        : `${Math.round(percent)}%`,
    tone: "active",
    progress: percent === null ? null : Math.min(100, Math.max(0, percent)),
    fullAt: null,
  };
}
