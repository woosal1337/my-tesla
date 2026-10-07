import type { Formatter } from "./format";

export type Tone = "good" | "typical" | "bad";

export type Assessment = {
  tone: Tone;
  verdict: string;
  expected: string;
  meaning: string;
};

export const toneClass: Record<Tone, string> = {
  good: "text-good",
  typical: "",
  bad: "text-bad",
};

export function assessmentTitle(assessment: Assessment): string {
  return `${assessment.verdict}. ${assessment.meaning}`;
}

function percent(value: number): string {
  return `${Math.round(value)}%`;
}

export function ratedWhPerKm(car: {
  efficiencyKwhPerKm: number | null;
}): number | null {
  return car.efficiencyKwhPerKm === null || car.efficiencyKwhPerKm <= 0
    ? null
    : car.efficiencyKwhPerKm * 1000;
}

const minimumDriveKm = 3;
const clearlyBelowRated = 0.97;
const typicalExtraUse = 0.35;

export function assessConsumption(
  whPerKm: number | null,
  ratedWhPerKm: number | null,
  f: Formatter,
  distanceKm: number | null = null,
): Assessment | null {
  if (whPerKm === null || ratedWhPerKm === null || ratedWhPerKm <= 0) {
    return null;
  }
  if (distanceKm !== null && distanceKm < minimumDriveKm) return null;
  const ratio = whPerKm / ratedWhPerKm;
  const change = Math.round(Math.abs(ratio - 1) * 100);
  const expected = `The rated value of this car is ${f.efficiency(ratedWhPerKm)}. On real roads, most cars use 15 to 35% more.`;
  if (ratio <= clearlyBelowRated) {
    return {
      tone: "good",
      verdict: "Better than rated",
      expected,
      meaning: `You used ${change}% less energy than the rated value.`,
    };
  }
  if (ratio <= 1 + typicalExtraUse) {
    return {
      tone: "typical",
      verdict: "Typical",
      expected,
      meaning:
        change === 0
          ? "You used the rated amount of energy."
          : ratio < 1
            ? `You used ${change}% less energy than the rated value.`
            : `You used ${change}% more energy than the rated value. This is normal on real roads.`,
    };
  }
  return {
    tone: "bad",
    verdict: "High",
    expected,
    meaning: `You used ${change}% more energy than the rated value. Cold weather, high speed, short trips, and heating raise the use.`,
  };
}

const healthCurve: readonly (readonly [number, number])[] = [
  [0, 100],
  [50_000, 95],
  [320_000, 85],
];

export function expectedHealth(odometerKm: number): number {
  const km = Math.max(0, odometerKm);
  for (let index = 1; index < healthCurve.length; index += 1) {
    const [toKm, toHealth] = healthCurve[index];
    if (km <= toKm || index === healthCurve.length - 1) {
      const [fromKm, fromHealth] = healthCurve[index - 1];
      const slope = (toHealth - fromHealth) / (toKm - fromKm);
      return Math.max(0, fromHealth + slope * (km - fromKm));
    }
  }
  return 100;
}

export function assessBatteryHealth(
  healthPercent: number | null,
  odometerKm: number | null,
  f: Formatter,
): Assessment | null {
  if (healthPercent === null || odometerKm === null) return null;
  const average = expectedHealth(odometerKm);
  const gap = healthPercent - average;
  const points = Math.round(Math.abs(gap));
  const expected = `About ${percent(average)} at ${f.distance(odometerKm)}. Tesla fleet data shows about 85% after 320,000 km for Model 3 and Model Y.`;
  if (gap >= -1) {
    return {
      tone: "good",
      verdict: "At or above average",
      expected,
      meaning: `Your battery keeps ${percent(healthPercent)} of its capacity, at or above the average for this distance.`,
    };
  }
  if (gap >= -6) {
    return {
      tone: "typical",
      verdict: "Close to average",
      expected,
      meaning: `Your battery keeps ${percent(healthPercent)}, ${points} points under the average. The estimate can move by 2 to 3 points.`,
    };
  }
  return {
    tone: "bad",
    verdict: "Below average",
    expected,
    meaning: `Your battery keeps ${percent(healthPercent)}, ${points} points under the average for this distance. A Tesla service center can test the battery.`,
  };
}

export function assessChargingEfficiency(
  efficiencyPercent: number | null,
  fast: boolean,
): Assessment | null {
  if (efficiencyPercent === null) return null;
  const [low, high] = fast ? [88, 95] : [80, 90];
  const expected = fast
    ? "A DC fast charge usually stores 92 to 97% of the energy from the charger."
    : "An AC charge usually stores 85 to 92% of the energy from the wall. ADAC measured 85% at a household socket and 92% at an 11 kW wallbox for a Model 3.";
  const lost = percent(100 - efficiencyPercent);
  if (efficiencyPercent >= high) {
    return {
      tone: "good",
      verdict: "Low losses",
      expected,
      meaning: `${percent(efficiencyPercent)} of the energy went into the battery. Only ${lost} became heat.`,
    };
  }
  if (efficiencyPercent >= low) {
    return {
      tone: "typical",
      verdict: "Normal losses",
      expected,
      meaning: `${percent(efficiencyPercent)} of the energy went into the battery, and ${lost} became heat.`,
    };
  }
  return {
    tone: "bad",
    verdict: "High losses",
    expected,
    meaning: `Only ${percent(efficiencyPercent)} of the energy went into the battery. A low charging power, a cold battery, or a car that stays awake adds losses.`,
  };
}

export function assessIdleLoss(
  levelPerDay: number | null,
  f: Formatter,
): Assessment | null {
  if (levelPerDay === null) return null;
  const expected =
    "A parked Tesla that sleeps loses about 1% a day. Sentry Mode and Cabin Overheat Protection raise the loss to 3 to 5% a day.";
  const loss = `${f.number(levelPerDay, 1)}%`;
  if (levelPerDay <= 1) {
    return {
      tone: "good",
      verdict: "Low drain",
      expected,
      meaning: `The car lost ${loss} a day while it stood parked.`,
    };
  }
  if (levelPerDay <= 3) {
    return {
      tone: "typical",
      verdict: "Normal drain",
      expected,
      meaning: `The car lost ${loss} a day while it stood parked.`,
    };
  }
  return {
    tone: "bad",
    verdict: "High drain",
    expected,
    meaning: `The car lost ${loss} a day while it stood parked. Check Sentry Mode, Cabin Overheat Protection, and apps that wake the car.`,
  };
}

export function assessIdlePower(
  watts: number | null,
  f: Formatter,
): Assessment | null {
  if (watts === null) return null;
  const expected =
    "A sleeping Tesla uses about 10 to 30 W. Sentry Mode uses about 100 to 350 W.";
  const power = `${f.number(Math.round(watts))} W`;
  if (watts <= 30) {
    return {
      tone: "good",
      verdict: "Low power",
      expected,
      meaning: `The car used ${power} on average while it stood parked.`,
    };
  }
  if (watts <= 150) {
    return {
      tone: "typical",
      verdict: "Normal power",
      expected,
      meaning: `The car used ${power} on average while it stood parked.`,
    };
  }
  return {
    tone: "bad",
    verdict: "High power",
    expected,
    meaning: `The car used ${power} on average while it stood parked. Sentry Mode, Cabin Overheat Protection, or an app that keeps the car awake uses this power.`,
  };
}

export function assessAsleep(share: number | null): Assessment | null {
  if (share === null) return null;
  const expected =
    "With Sentry Mode off, a parked Tesla sleeps 80% of the time or more.";
  const asleep = percent(share * 100);
  if (share >= 0.8) {
    return {
      tone: "good",
      verdict: "Sleeps well",
      expected,
      meaning: `The car slept ${asleep} of the parked time.`,
    };
  }
  if (share >= 0.4) {
    return {
      tone: "typical",
      verdict: "Sleeps part of the time",
      expected,
      meaning: `The car slept ${asleep} of the parked time.`,
    };
  }
  return {
    tone: "bad",
    verdict: "Stays awake",
    expected,
    meaning: `The car slept only ${asleep} of the parked time. Sentry Mode, Cabin Overheat Protection, or an app keeps it awake.`,
  };
}

const recommendedBar = 2.9;

export function assessTirePressure(
  bar: number | null,
  f: Formatter,
): Assessment | null {
  if (bar === null) return null;
  const gap = bar - recommendedBar;
  const off = Math.abs(gap);
  const expected = `Tesla gives ${f.pressure(recommendedBar)} cold for most Model 3 and Model Y wheels. The label in the door frame gives the value for your wheels. Warm tires read up to ${f.pressure(0.3)} more.`;
  const side = `${f.pressure(off)} ${gap < 0 ? "under" : "over"} the recommended value`;
  if (off <= 0.15) {
    return {
      tone: "good",
      verdict: "Correct pressure",
      expected,
      meaning: `${f.pressure(bar)} is close to the recommended value.`,
    };
  }
  if (off <= 0.35) {
    return {
      tone: "typical",
      verdict: "Slightly off",
      expected,
      meaning: `${f.pressure(bar)} is ${side}.`,
    };
  }
  return {
    tone: "bad",
    verdict: "Check the pressure",
    expected,
    meaning: `${f.pressure(bar)} is ${side}. A correct pressure saves energy and tire wear.`,
  };
}

export function assessBatteryLevel(
  level: number | null,
  charging: boolean,
): Assessment | null {
  if (level === null) return null;
  const expected =
    "Tesla advises to keep the battery above 20% in daily use, and to charge before it gets low.";
  if (level < 20 && !charging) {
    return {
      tone: "bad",
      verdict: "Low battery",
      expected,
      meaning: `${Math.round(level)}% is left. Charge soon.`,
    };
  }
  return {
    tone: "typical",
    verdict: charging ? "Charging" : "Normal level",
    expected,
    meaning: `${Math.round(level)}% is left.`,
  };
}

export function assessVoltage(
  volts: number | null,
  fast: boolean,
): Assessment | null {
  if (volts === null || fast) return null;
  const expected =
    "The grid gives 230 V with a tolerance of 10%, so 207 to 253 V, under the EN 50160 norm.";
  const value = `${Math.round(volts)} V`;
  if (volts < 207) {
    return {
      tone: "bad",
      verdict: "Low voltage",
      expected,
      meaning: `${value} is under 207 V. A long or thin cable, or a weak supply, lowers the voltage and slows the charge.`,
    };
  }
  if (volts > 253) {
    return {
      tone: "bad",
      verdict: "High voltage",
      expected,
      meaning: `${value} is over 253 V, above the grid norm.`,
    };
  }
  return {
    tone: "typical",
    verdict: "Normal voltage",
    expected,
    meaning: `${value} is in the normal range.`,
  };
}
