const factors = [1, 2, 5, 10];

function niceStep(raw: number, after = 0): number {
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
