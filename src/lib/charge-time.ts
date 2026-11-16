export type LevelTime = {
  fast: boolean;
  level: number;
  sessions: number;
  typicalS: number;
  slowS: number;
};

export type ChargeLeg = { from: number; to: number; current: boolean };

export type ChargeTime = { typicalMin: number; slowMin: number };

export type ChargeHistory = { sessions: number; from: number; to: number };

export const chargeTimeHistoryDays = 730;

export const chargeTimeTitle = `Charging time, last ${chargeTimeHistoryDays / 365} years`;

const usualLimit = 80;

const standardLegs = [
  [10, usualLimit],
  [20, usualLimit],
  [usualLimit, 100],
] as const;

export function chargeLegs(currentLevel: number | null): ChargeLeg[] {
  const legs = standardLegs.map(([from, to]) => ({
    from,
    to,
    current: from === currentLevel,
  }));
  if (
    currentLevel === null ||
    currentLevel < 0 ||
    currentLevel >= 100 ||
    legs.some((leg) => leg.current)
  ) {
    return legs;
  }
  return [
    {
      from: currentLevel,
      to: currentLevel < usualLimit ? usualLimit : 100,
      current: true,
    },
    ...legs,
  ];
}

export function chargeTime(
  levels: LevelTime[],
  fast: boolean,
  leg: { from: number; to: number },
): ChargeTime | null {
  const steps = levels.filter(
    (step) =>
      step.fast === fast && step.level >= leg.from && step.level < leg.to,
  );
  if (leg.to <= leg.from || steps.length !== leg.to - leg.from) return null;
  return {
    typicalMin: steps.reduce((sum, step) => sum + step.typicalS, 0) / 60,
    slowMin: steps.reduce((sum, step) => sum + step.slowS, 0) / 60,
  };
}

export function chargeHistory(
  levels: LevelTime[],
  fast: boolean,
): ChargeHistory | null {
  const steps = levels.filter((step) => step.fast === fast);
  if (steps.length === 0) return null;
  return {
    sessions: Math.max(...steps.map((step) => step.sessions)),
    from: Math.min(...steps.map((step) => step.level)),
    to: Math.max(...steps.map((step) => step.level)) + 1,
  };
}
