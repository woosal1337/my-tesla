export function swipeStep(
  dx: number,
  dy: number,
  minDistance: number,
): -1 | 0 | 1 {
  if (Math.abs(dx) < minDistance || Math.abs(dx) <= 2 * Math.abs(dy)) return 0;
  return dx > 0 ? -1 : 1;
}
