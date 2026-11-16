import { describe, expect, test } from "bun:test";
import { installMark, isNewInstall, keychainKeys } from "./install";

describe("isNewInstall", () => {
  test("an empty store is a new install", () => {
    expect(isNewInstall([])).toBe(true);
  });

  test("a store with the install mark is a later start", () => {
    expect(isNewInstall([installMark])).toBe(false);
  });

  test("an update from a version without the mark keeps the connection", () => {
    expect(isNewInstall(["cars:https://example.test"])).toBe(false);
  });

  test("a store with only the theme choice is a later start", () => {
    expect(isNewInstall(["theme"])).toBe(false);
  });
});

describe("keychainKeys", () => {
  test("keeps the names that earlier versions stored", () => {
    expect(keychainKeys).toEqual({
      connection: "connection",
      car: "car",
      alerts: "alert-events",
    });
  });
});
