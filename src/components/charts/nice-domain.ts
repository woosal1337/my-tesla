const factors = [1, 2, 5, 10];

export function niceStep(raw: number, after = 0): number {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const candidates = factors.map((factor) => factor * magnitude);
  return (
    candidates.find((candidate) => candidate >= raw && candidate > after) ??
    candidates.at(-1)! * 2
  );
}

export function niceDomain(
  values: number[],
  intervals = 4,
): [number, number] | undefined {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return undefined;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const spread = max - min || Math.abs(max) * 0.02 || 1;
  const low = min - spread * 0.1;
  const high = max + spread * 0.1;
  let step = niceStep((high - low) / intervals);
  let start = Math.floor(low / step) * step;
  while (start + intervals * step < high) {
    step = niceStep(step, step);
    start = Math.floor(low / step) * step;
  }
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  return [round(start), round(start + intervals * step)];
}

const zeroFactors = [1, 2, 2.5, 5, 10];
const zeroIntervals = [4, 5, 3];

function roundTick(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function evenStep(raw: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  return (
    zeroFactors
      .map((factor) => factor * magnitude)
      .find((step) => step >= raw) ?? magnitude * 10
  );
}

export function niceZeroDomain(values: number[]): [number, number] | undefined {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return undefined;
  if (Math.min(...finite) < 0) return niceDomain(finite);
  const target = Math.max(...finite) * 1.05 || 1;
  const tops = zeroIntervals.map(
    (intervals) => evenStep(target / intervals) * intervals,
  );
  return [0, roundTick(Math.min(...tops))];
}

export function evenTicks([low, high]: [number, number]): number[] {
  const spread = high - low;
  const intervals =
    zeroIntervals.find((count) => {
      const step = spread / count;
      return roundTick(evenStep(step)) === roundTick(step);
    }) ?? 4;
  return Array.from({ length: intervals + 1 }, (_, index) =>
    roundTick(low + (spread * index) / intervals),
  );
}
