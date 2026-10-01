export type DrivePoint = {
  at: number;
  speedKmh: number | null;
  powerKw: number | null;
  elevationM: number | null;
  battery: number | null;
};

export type DriveEnergy = { usedKwh: number; recoveredKwh: number };

const hourMs = 3_600_000;
const longestGapMs = 5 * 60_000;
const maxChartPoints = 400;

export function driveEnergy(points: DrivePoint[]): DriveEnergy {
  let usedKwh = 0;
  let recoveredKwh = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const gapMs = current.at - previous.at;
    if (gapMs <= 0 || gapMs > longestGapMs) continue;
    if (previous.powerKw === null || current.powerKw === null) continue;
    const kwh = ((previous.powerKw + current.powerKw) / 2) * (gapMs / hourMs);
    if (kwh >= 0) usedKwh += kwh;
    else recoveredKwh -= kwh;
  }
  return { usedKwh, recoveredKwh };
}

function mean(values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  if (known.length === 0) return null;
  return known.reduce((sum, value) => sum + value, 0) / known.length;
}

export function sampleDrive(
  points: DrivePoint[],
  max = maxChartPoints,
): DrivePoint[] {
  if (points.length <= max) return points;
  const size = Math.ceil(points.length / max);
  const sampled: DrivePoint[] = [];
  for (let start = 0; start < points.length; start += size) {
    const bucket = points.slice(start, start + size);
    sampled.push({
      at: bucket[0].at,
      speedKmh: mean(bucket.map((point) => point.speedKmh)),
      powerKw: mean(bucket.map((point) => point.powerKw)),
      elevationM: mean(bucket.map((point) => point.elevationM)),
      battery: bucket.at(-1)?.battery ?? null,
    });
  }
  return sampled;
}
