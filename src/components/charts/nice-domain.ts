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

const fitIntervals = [4, 5, 3];
const fitPadding = 0.05;
const maxCoarserFits = 24;

export function fitAxis(
  values: number[],
  label?: (value: number) => string,
): { domain: [number, number]; ticks: number[] } | undefined {
  const finite = values.filter((value) => Number.isFinite(value));
  if (!finite.length) return undefined;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const spread = max - min || Math.abs(max) * 0.02 || 1;
  const padded = min - spread * fitPadding;
  const low = min >= 0 ? Math.max(0, padded) : padded;
  const high = max + spread * fitPadding;
  const fitFrom = (minStep: number) => {
    const candidates = fitIntervals.map((count) => {
      let step = niceStep(Math.max((high - low) / count, minStep));
      const startOf = () => Math.floor(roundTick(low / step)) * step;
      let start = startOf();
      while (start + count * step < high) {
        step = niceStep(step, step);
        start = startOf();
      }
      return { count, step, start };
    });
    const span = ({ count, step }: { count: number; step: number }) =>
      roundTick(count * step);
    const best = candidates.reduce((fit, candidate) =>
      span(candidate) < span(fit) ? candidate : fit,
    );
    const ticks = Array.from({ length: best.count + 1 }, (_, index) =>
      roundTick(best.start + index * best.step),
    );
    return { step: best.step, ticks };
  };
  const repeats = (ticks: number[]) =>
    label !== undefined && new Set(ticks.map(label)).size < ticks.length;
  let fit = fitFrom(0);
  for (let tries = 0; tries < maxCoarserFits && repeats(fit.ticks); tries++) {
    fit = fitFrom(niceStep(fit.step, fit.step));
  }
  return { domain: [fit.ticks[0]!, fit.ticks.at(-1)!], ticks: fit.ticks };
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
