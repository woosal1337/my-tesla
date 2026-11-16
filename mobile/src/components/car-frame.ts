import type { CarImageFrame } from "@contract";

type Percent = `${number}%`;

export type CarSlot = {
  aspectRatio: number;
  image: { left: Percent; top: Percent; width: Percent; height: Percent };
};

const renderAspectRatio = 16 / 9;

const wholeImage: CarImageFrame = { left: 0, top: 0, width: 1, height: 1 };

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function usable(frame: unknown): frame is CarImageFrame {
  if (typeof frame !== "object" || frame === null) return false;
  const { left, top, width, height } = frame as Record<string, unknown>;
  return (
    finite(left) &&
    finite(top) &&
    finite(width) &&
    finite(height) &&
    left >= 0 &&
    top >= 0 &&
    width > 0 &&
    height > 0 &&
    left + width <= 1 &&
    top + height <= 1
  );
}

function percent(share: number): Percent {
  return `${share * 100}%`;
}

export function carSlot(frame: unknown): CarSlot {
  const { left, top, width, height } = usable(frame) ? frame : wholeImage;
  return {
    aspectRatio: (width / height) * renderAspectRatio,
    image: {
      left: percent(-left / width),
      top: percent(-top / height),
      width: percent(1 / width),
      height: percent(1 / height),
    },
  };
}
