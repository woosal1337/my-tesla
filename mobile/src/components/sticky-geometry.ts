export type HeadingBox = { y: number; height: number };

export function stickyRange(
  box: HeadingBox | null,
  nextY: number | undefined,
): { inputRange: number[]; outputRange: number[] } {
  const inputRange = [-1, 0];
  const outputRange = [0, 0];
  if (!box) {
    return { inputRange, outputRange };
  }
  inputRange.push(box.y);
  outputRange.push(0);
  const collision = (nextY ?? 0) - box.height;
  if (collision >= box.y) {
    inputRange.push(collision, collision + 1);
    outputRange.push(collision - box.y, collision - box.y);
  } else {
    inputRange.push(box.y + 1);
    outputRange.push(1);
  }
  return { inputRange, outputRange };
}

export function headerCoversScreen(
  os: string,
  osVersion: string | number,
  largeTitle: boolean,
): boolean {
  return (
    os === "ios" && (largeTitle || Number.parseInt(String(osVersion), 10) >= 26)
  );
}
