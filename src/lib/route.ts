export type LngLat = [number, number];

const maxRoutePoints = 500;

export function sampleRoute(points: LngLat[], max = maxRoutePoints): LngLat[] {
  if (points.length <= max) return points;
  if (max < 2) return points.slice(0, Math.max(0, max));
  const step = (points.length - 1) / (max - 1);
  return Array.from(
    { length: max },
    (_, index) => points[Math.round(index * step)],
  );
}

export function routeBounds(points: LngLat[]): [LngLat, LngLat] | null {
  if (!points.length) return null;
  let [west, south] = points[0];
  let [east, north] = points[0];
  for (const [lng, lat] of points) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return [
    [west, south],
    [east, north],
  ];
}
