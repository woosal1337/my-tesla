import { describe, expect, test } from "bun:test";
import {
  assessAsleep,
  assessBatteryHealth,
  assessBatteryLevel,
  assessChargingEfficiency,
  assessConsumption,
  assessIdleLoss,
  assessIdlePower,
  assessTirePressure,
  assessVoltage,
  assessmentTitle,
  expectedHealth,
} from "./assessment";
import { createFormatter } from "./format";
import { defaultPreferences } from "./preferences";

const f = createFormatter(defaultPreferences, "Europe/Istanbul");
const psi = createFormatter(
  { ...defaultPreferences, pressure: "psi" },
  "Europe/Istanbul",
);

describe("assessConsumption", () => {
  test("compares a drive with the rated consumption", () => {
    expect(assessConsumption(130, 136, f, 20)?.tone).toBe("good");
    expect(assessConsumption(136, 136, f, 20)?.meaning).toBe(
      "You used the rated amount of energy.",
    );
    const near = assessConsumption(134, 136, f, 20);
    expect(near?.tone).toBe("typical");
    expect(near?.meaning).toBe("You used 1% less energy than the rated value.");
    const typical = assessConsumption(170, 136, f, 20);
    expect(typical?.tone).toBe("typical");
    expect(typical?.meaning).toContain("25% more");
    expect(typical?.expected).toContain("136 Wh/km");
    expect(assessConsumption(183, 136, f, 20)?.tone).toBe("typical");
    expect(assessConsumption(184, 136, f, 20)?.tone).toBe("bad");
  });

  test("skips a short drive and a car without a rated value", () => {
    expect(assessConsumption(400, 136, f, 2)).toBeNull();
    expect(assessConsumption(150, null, f, 20)).toBeNull();
    expect(assessConsumption(null, 136, f, 20)).toBeNull();
    expect(assessConsumption(150, 136, f)?.tone).toBe("typical");
  });
});

describe("assessBatteryHealth", () => {
  test("follows the fleet curve", () => {
    expect(expectedHealth(0)).toBe(100);
    expect(expectedHealth(50_000)).toBe(95);
    expect(expectedHealth(185_000)).toBeCloseTo(90, 6);
    expect(expectedHealth(320_000)).toBe(85);
    expect(expectedHealth(455_000)).toBeCloseTo(80, 6);
  });

  test("compares the health with the curve", () => {
    expect(assessBatteryHealth(99.5, 1_341, f)?.tone).toBe("good");
    const close = assessBatteryHealth(96, 1_341, f);
    expect(close?.tone).toBe("typical");
    expect(close?.meaning).toContain("4 points under");
    expect(assessBatteryHealth(90, 1_341, f)?.tone).toBe("bad");
    expect(assessBatteryHealth(null, 1_341, f)).toBeNull();
  });
});

describe("assessChargingEfficiency", () => {
  test.each([
    [92, false, "good"],
    [88, false, "typical"],
    [79, false, "bad"],
    [96, true, "good"],
    [90, true, "typical"],
    [85, true, "bad"],
  ] as const)("%p%%, fast %p", (value, fast, tone) => {
    expect(assessChargingEfficiency(value, fast)?.tone).toBe(tone);
  });

  test("names the losses", () => {
    expect(assessChargingEfficiency(88, false)?.meaning).toBe(
      "88% of the energy went into the battery, and 12% became heat.",
    );
    expect(assessChargingEfficiency(null, false)).toBeNull();
  });
});

describe("idle drain", () => {
  test("rates the loss per day", () => {
    expect(assessIdleLoss(0.6, f)?.tone).toBe("good");
    expect(assessIdleLoss(2.2, f)?.tone).toBe("typical");
    expect(assessIdleLoss(4.5, f)?.meaning).toContain("4.5% a day");
    expect(assessIdleLoss(4.5, f)?.tone).toBe("bad");
  });

  test("rates the power and the sleep share", () => {
    expect(assessIdlePower(22, f)?.tone).toBe("good");
    expect(assessIdlePower(90, f)?.tone).toBe("typical");
    expect(assessIdlePower(260, f)?.tone).toBe("bad");
    expect(assessAsleep(0.9)?.tone).toBe("good");
    expect(assessAsleep(0.6)?.tone).toBe("typical");
    expect(assessAsleep(0.2)?.meaning).toContain("only 20%");
    expect(assessIdlePower(null, f)).toBeNull();
    expect(assessAsleep(null)).toBeNull();
  });
});

describe("assessTirePressure", () => {
  test("compares a tire with the recommended pressure", () => {
    expect(assessTirePressure(2.9, f)?.tone).toBe("good");
    const low = assessTirePressure(2.7, f);
    expect(low?.tone).toBe("typical");
    expect(low?.meaning).toBe(
      "2.7 bar is 0.2 bar under the recommended value.",
    );
    expect(assessTirePressure(2.5, f)?.tone).toBe("bad");
    expect(assessTirePressure(3.3, f)?.meaning).toContain("over");
    expect(assessTirePressure(2.9, psi)?.expected).toContain("42 psi");
  });
});

describe("level and voltage", () => {
  test("marks a low battery that does not charge", () => {
    expect(assessBatteryLevel(15, false)?.tone).toBe("bad");
    expect(assessBatteryLevel(15, true)?.tone).toBe("typical");
    expect(assessBatteryLevel(64, false)?.verdict).toBe("Normal level");
  });

  test("checks the AC voltage against the grid norm", () => {
    expect(assessVoltage(215, false)?.tone).toBe("typical");
    expect(assessVoltage(198, false)?.verdict).toBe("Low voltage");
    expect(assessVoltage(258, false)?.verdict).toBe("High voltage");
    expect(assessVoltage(390, true)).toBeNull();
  });

  test("joins the verdict and the meaning for a plain title", () => {
    const assessment = assessVoltage(215, false);
    expect(assessment && assessmentTitle(assessment)).toBe(
      "Normal voltage. 215 V is in the normal range.",
    );
  });
});
