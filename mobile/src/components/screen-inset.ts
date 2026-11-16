export const readableWidth = 672;

export function screenInset(windowWidth: number, padding: number): number {
  return Math.max(padding, (windowWidth - readableWidth) / 2);
}
