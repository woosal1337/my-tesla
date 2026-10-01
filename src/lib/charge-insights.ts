export type CurveInput = {
  id: number;
  startAt: Date;
  points: { level: number; power: number }[];
};

export type CurveKey = { key: string; id: number; startAt: Date };

export function curveRows(curves: CurveInput[]): {
  rows: Record<string, number | null>[];
  keys: CurveKey[];
} {
  const keys = curves.map((curve) => ({
    key: `s${curve.id}`,
    id: curve.id,
    startAt: curve.startAt,
  }));
  const levels = [
    ...new Set(
      curves.flatMap((curve) => curve.points.map((point) => point.level)),
    ),
  ].sort((a, b) => a - b);
  const rows = levels.map((level) => {
    const row: Record<string, number | null> = { level };
    for (const curve of curves) {
      const point = curve.points.find((candidate) => candidate.level === level);
      row[`s${curve.id}`] = point ? Math.round(point.power * 10) / 10 : null;
    }
    return row;
  });
  return { rows, keys };
}

export function costPerKwh(cost: number | null, kwh: number): number | null {
  return cost === null || kwh <= 0 ? null : cost / kwh;
}

export function costPer100Km(
  cost: number | null,
  distanceKm: number,
): number | null {
  return cost === null || distanceKm <= 0 ? null : (cost / distanceKm) * 100;
}
