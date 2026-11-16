import { describe, expect, test } from "bun:test";
import { carSlot } from "./car-frame";

function share(text: string): number {
  expect(text.endsWith("%")).toBe(true);
  return Number.parseFloat(text);
}

describe("carSlot", () => {
  test("scales the render so that the car fills the slot", () => {
    const slot = carSlot({
      left: 0.227,
      top: 0.275,
      width: 0.558,
      height: 0.422,
    });
    expect(slot.aspectRatio).toBeCloseTo(2.351, 3);
    expect(share(slot.image.width)).toBeCloseTo(179.2, 1);
    expect(share(slot.image.height)).toBeCloseTo(237.0, 1);
    expect(share(slot.image.left)).toBeCloseTo(-40.7, 1);
    expect(share(slot.image.top)).toBeCloseTo(-65.2, 1);
  });

  test("keeps the 16:9 render inside the scaled box", () => {
    const slot = carSlot({
      left: 0.144,
      top: 0.294,
      width: 0.688,
      height: 0.446,
    });
    const width = share(slot.image.width) / 100;
    const height = share(slot.image.height) / 100;
    expect((width * slot.aspectRatio) / height).toBeCloseTo(16 / 9, 6);
  });

  test("shows the whole render for a frame that is missing or wrong", () => {
    const wrong: unknown[] = [
      null,
      undefined,
      "0.2,0.3,0.5,0.4",
      { left: 0.2, top: 0.3, width: 0.5 },
      { left: 0.2, top: 0.3, width: 0, height: 0.4 },
      { left: Number.NaN, top: 0.3, width: 0.5, height: 0.4 },
      { left: 0.6, top: 0.3, width: 0.5, height: 0.4 },
    ];
    for (const frame of wrong) {
      expect(carSlot(frame)).toEqual({
        aspectRatio: 16 / 9,
        image: { left: "0%", top: "0%", width: "100%", height: "100%" },
      });
    }
  });
});
