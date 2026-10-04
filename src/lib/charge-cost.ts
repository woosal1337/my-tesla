export type ChargePrices = {
  perKwh: number | null;
  fastPerKwh: number | null;
};

export const noPrices: ChargePrices = { perKwh: null, fastPerKwh: null };

const maximumPrice = 100_000;
const priceDigits = 4;

export function readPrice(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > maximumPrice) return null;
  const factor = 10 ** priceDigits;
  return Math.round(value * factor) / factor;
}

export function parsePrice(text: string): number | null | "invalid" {
  const compact = text.replace(/[\s  ]/g, "");
  if (compact === "") return null;
  if (!/^\d+([.,]\d+)?$/.test(compact)) return "invalid";
  return readPrice(Number(compact.replace(",", "."))) ?? "invalid";
}

export function priceText(value: number | null, decimalComma: boolean) {
  if (value === null) return "";
  const text = String(value);
  return decimalComma ? text.replace(".", ",") : text;
}

export type CostInput = {
  cost: number | null;
  addedKwh: number | null;
  billedKwh: number | null;
  rangeAdded: number | null;
  levelsAdded: number | null;
};

export type CostBreakdown = {
  perKwhBilled: number | null;
  perKwhAdded: number | null;
  lossKwh: number | null;
  lossCost: number | null;
  per100Range: number | null;
  perLevel: number | null;
};

function ratio(cost: number, amount: number | null): number | null {
  return amount !== null && amount > 0 ? cost / amount : null;
}

export function costBreakdown(input: CostInput): CostBreakdown | null {
  const { cost, addedKwh, billedKwh } = input;
  if (cost === null) return null;
  const perKwhBilled = ratio(cost, billedKwh);
  const lossKwh =
    addedKwh !== null && billedKwh !== null && billedKwh > addedKwh
      ? billedKwh - addedKwh
      : null;
  const perUnit = ratio(cost, input.rangeAdded);
  return {
    perKwhBilled,
    perKwhAdded: ratio(cost, addedKwh),
    lossKwh,
    lossCost:
      lossKwh !== null && perKwhBilled !== null ? lossKwh * perKwhBilled : null,
    per100Range: perUnit === null ? null : perUnit * 100,
    perLevel: ratio(cost, input.levelsAdded),
  };
}
