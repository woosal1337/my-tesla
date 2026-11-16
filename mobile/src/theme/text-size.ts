export const largeTextCap = 1.2;
export const textCap = 2;
export const iconCap = 1.5;
const largeLayoutFrom = 1.3;

export function isLargeText(fontScale: number): boolean {
  return fontScale >= largeLayoutFrom;
}

export function iconScale(fontScale: number): number {
  return Math.min(Math.max(fontScale, 1), iconCap);
}

export function axisScale(fontScale: number): number {
  return Math.min(Math.max(fontScale, 1), largeTextCap);
}
