type TireKey = "frontLeft" | "frontRight" | "rearLeft" | "rearRight";

export type TireDay = { at: Date } & Record<TireKey, number | null>;

export type SlowLeak = { tire: TireKey; dropBar: number; days: number };

const tireLabels: Record<TireKey, string> = {
  frontLeft: "Front left",
  frontRight: "Front right",
  rearLeft: "Rear left",
  rearRight: "Rear right",
};

const tireKeys: TireKey[] = [
  "frontLeft",
  "frontRight",
  "rearLeft",
  "rearRight",
];
const dayMs = 86_400_000;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function slope(points: { x: number; y: number }[]): number {
  const n = points.length;
  const meanX = points.reduce((sum, point) => sum + point.x, 0) / n;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / n;
  let top = 0;
  let bottom = 0;
  for (const point of points) {
    top += (point.x - meanX) * (point.y - meanY);
    bottom += (point.x - meanX) ** 2;
  }
  return bottom === 0 ? 0 : top / bottom;
}

export function slowLeaks(
  days: TireDay[],
  options = { minDays: 5, minDropBar: 0.1 },
): SlowLeak[] {
  const complete = days.filter((day) =>
    tireKeys.every((key) => day[key] !== null),
  );
  if (complete.length < options.minDays) return [];
  const first = complete[0].at.getTime();
  const span = (complete.at(-1)!.at.getTime() - first) / dayMs;
  if (span <= 0) return [];
  const leaks: SlowLeak[] = [];
  for (const tire of tireKeys) {
    const points = complete.map((day) => ({
      x: (day.at.getTime() - first) / dayMs,
      y:
        (day[tire] as number) -
        median(
          tireKeys
            .filter((key) => key !== tire)
            .map((key) => day[key] as number),
        ),
    }));
    const dropBar = -slope(points) * span;
    if (dropBar >= options.minDropBar) {
      leaks.push({ tire, dropBar, days: Math.round(span) });
    }
  }
  return leaks;
}

export function leakWarning(
  leak: SlowLeak,
  pressure: (bar: number) => string,
): string {
  return `${tireLabels[leak.tire]} tire: down ${pressure(leak.dropBar)} against the other tires in ${leak.days} days. Check it for a slow leak.`;
}
