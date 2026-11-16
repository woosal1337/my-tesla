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

export function curveLabels(
  keys: CurveKey[],
  date: (at: Date) => string,
  clock: (at: Date) => string,
): string[] {
  const dates = keys.map((key) => date(key.startAt));
  return keys.map((key, index) =>
    dates.indexOf(dates[index]!) === dates.lastIndexOf(dates[index]!)
      ? dates[index]!
      : `${dates[index]} ${clock(key.startAt)}`,
  );
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

type TypeTotals = {
  fast: boolean;
  sessions: number;
  addedKwh: number;
  cost: number | null;
  costedKwh: number;
};

export function chargeInsightTotals(types: TypeTotals[], drivenKm: number) {
  const costs = types
    .map((type) => type.cost)
    .filter((cost): cost is number => cost !== null);
  const cost = costs.length
    ? costs.reduce((sum, value) => sum + value, 0)
    : null;
  const costedKwh = types.reduce((sum, type) => sum + type.costedKwh, 0);
  return {
    ac: types.find((type) => !type.fast),
    dc: types.find((type) => type.fast),
    sessions: types.reduce((sum, type) => sum + type.sessions, 0),
    addedKwh: types.reduce((sum, type) => sum + type.addedKwh, 0),
    cost,
    perKwh: costPerKwh(cost, costedKwh),
    perKm: costPer100Km(cost, drivenKm),
  };
}
