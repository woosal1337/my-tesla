import { describe, expect, test } from "bun:test";
import { parseTopic, topicFilter, withMessage } from "./topics";

describe("topicFilter", () => {
  test("matches one level of car topics", () => {
    expect(topicFilter(null)).toBe("teslamate/cars/+/+");
    expect(topicFilter("account_0")).toBe("teslamate/account_0/cars/+/+");
  });
});

describe("parseTopic", () => {
  test("reads the car and the key", () => {
    expect(parseTopic("teslamate/cars/2/locked", null)).toEqual({
      carId: 2,
      key: "locked",
    });
    expect(
      parseTopic("teslamate/account_0/cars/7/charge_limit_soc", "account_0"),
    ).toEqual({ carId: 7, key: "charge_limit_soc" });
  });

  test.each([
    "teslamate/cars/2",
    "teslamate/cars/x/locked",
    "teslamate/cars/0/locked",
    "teslamate/cars/2/a/b",
    "teslamate/account_0/cars/2/locked",
    "homeassistant/sensor/2/config",
  ])("ignores %s", (topic) => {
    expect(parseTopic(topic, null)).toBeNull();
  });
});

describe("withMessage", () => {
  test("stores a new value and keeps the same object for a repeat", () => {
    const first = withMessage({}, "locked", "true");
    expect(first).toEqual({ locked: "true" });
    expect(withMessage(first, "locked", "true")).toBe(first);
  });

  test("removes a value when TeslaMate clears the topic", () => {
    const values = { locked: "true", geofence: "Home" };
    expect(withMessage(values, "geofence", "")).toEqual({ locked: "true" });
    expect(withMessage(values, "missing", "")).toBe(values);
  });
});
