import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  AnalyticsConfigError,
  analyticsEvents,
  eventProps,
  outboundProps,
  readAnalyticsConfig,
  trackEvent,
} from "./analytics";

describe("readAnalyticsConfig", () => {
  test("is off without both values", () => {
    expect(readAnalyticsConfig({})).toBeNull();
    expect(
      readAnalyticsConfig({ OPEN_ANALYTICS_URL: "https://oa-c.example.com" }),
    ).toBeNull();
    expect(readAnalyticsConfig({ OPEN_ANALYTICS_KEY: "oa_pk_x" })).toBeNull();
  });

  test("keeps only the origin of the collector", () => {
    expect(
      readAnalyticsConfig({
        OPEN_ANALYTICS_URL: "https://oa-c.example.com/oa.js",
        OPEN_ANALYTICS_KEY: " oa_pk_x ",
      }),
    ).toEqual({ collectorUrl: "https://oa-c.example.com", key: "oa_pk_x" });
  });

  test.each(["not a url", "ftp://oa-c.example.com"])("refuses %s", (url) => {
    expect(() =>
      readAnalyticsConfig({
        OPEN_ANALYTICS_URL: url,
        OPEN_ANALYTICS_KEY: "oa_pk_x",
      }),
    ).toThrow(AnalyticsConfigError);
  });
});

describe("eventProps", () => {
  test("names the event and lowercases the property names", () => {
    expect(
      eventProps(analyticsEvents.demoOpen, { Place: "hero", empty: undefined }),
    ).toEqual({ "data-oa-event": "demo_open", "data-oa-prop-place": "hero" });
  });

  test("gives the host of an outbound link", () => {
    expect(outboundProps("https://www.github.com/teslamate-org")).toEqual({
      "data-oa-event": "outbound_click",
      "data-oa-prop-host": "github.com",
    });
  });
});

describe("trackEvent", () => {
  const scope = globalThis as { oa?: unknown };
  afterEach(() => {
    delete scope.oa;
  });

  test("does nothing without the tracker", () => {
    expect(() => trackEvent(analyticsEvents.settingsChange)).not.toThrow();
  });

  test("sends the event to the tracker", () => {
    const track = mock();
    scope.oa = { track };
    trackEvent(analyticsEvents.settingsChange, { setting: "distance" });
    expect(track).toHaveBeenCalledWith("settings_change", {
      setting: "distance",
    });
  });
});
