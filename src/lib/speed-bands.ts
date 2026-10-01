const kmPerMile = 1.609344;

const edgesByUnit = {
  km: [5, 30, 50, 70, 90, 110, 130],
  mi: [3, 20, 30, 40, 50, 60, 70, 80],
} as const;

export type SpeedBandRow = {
  band: number;
  points: number;
  powerSum: number;
  speedSum: number;
};

export type SpeedBand = {
  from: number;
  to: number | null;
  whPerKm: number;
  share: number;
};

export function speedEdges(distanceUnit: "km" | "mi"): {
  shown: number[];
  kmh: number[];
} {
  const shown = [...edgesByUnit[distanceUnit]];
  const factor = distanceUnit === "mi" ? kmPerMile : 1;
  return { shown, kmh: shown.map((edge) => edge * factor) };
}

export function speedBands(
  rows: SpeedBandRow[],
  shown: number[],
  minimumPoints = 20,
): SpeedBand[] {
  const total = rows.reduce((sum, row) => sum + row.points, 0);
  if (total === 0) return [];
  return rows
    .filter(
      (row) =>
        row.band >= 1 &&
        row.band <= shown.length &&
        row.points >= minimumPoints &&
        row.speedSum > 0,
    )
    .sort((a, b) => a.band - b.band)
    .map((row) => ({
      from: shown[row.band - 1],
      to: row.band < shown.length ? shown[row.band] : null,
      whPerKm: (row.powerSum / row.speedSum) * 1000,
      share: row.points / total,
    }));
}
