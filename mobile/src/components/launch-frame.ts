export const launchMarkSize = 56;

export function launchFrame(
  height: number,
  gap: number,
): { markTop: number; contentTop: number } {
  const markTop = (height - launchMarkSize) / 2;
  return { markTop, contentTop: markTop + launchMarkSize + gap };
}
