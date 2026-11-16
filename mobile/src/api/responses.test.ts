import { describe, expect, test } from "bun:test";
import {
  carList,
  chargeDetail,
  driveList,
  insightPage,
  overviewPage,
  pushCatalog,
  appMe,
  pairClaim,
  pairStatus,
  responseProblem,
  basemapKeyOf,
  reportPage,
  settingsPage,
  timelinePage,
  yearPage,
} from "./responses";

const car = { id: 2, name: "Juniper", model: "Model Y", trim: "SR" };

describe("responseProblem", () => {
  test("explains the answers that hold no data", () => {
    expect(responseProblem(200, "application/json", null)).toBeNull();
    expect(responseProblem(204, null, null)).toBeNull();
    expect(responseProblem(403, "text/plain", null)).toContain(
      "Pair this phone",
    );
    expect(responseProblem(200, "text/html", null)).toContain("login page");
    expect(
      responseProblem(
        409,
        "application/json",
        "Push alerts need the MQTT feed.",
      ),
    ).toBe("Push alerts need the MQTT feed.");
    expect(responseProblem(503, "application/json", null)).toContain("failed");
  });
});

describe("carList", () => {
  test("takes the cars of a My Tesla server only", () => {
    expect(carList({ cars: [car], defaultCarId: 2 })).toEqual({
      cars: [car],
      defaultCarId: 2,
    });
    expect(carList({ cars: [car] })).toEqual({
      cars: [car],
      defaultCarId: null,
    });
    expect(carList({ cars: [{ id: "2" }] })).toBeNull();
    expect(carList({ status: "ok" })).toBeNull();
  });
});

describe("pushCatalog", () => {
  test("checks the alert list", () => {
    const events = [
      { id: "tire-warning", title: "Tire pressure", description: "A tire." },
    ];
    expect(pushCatalog({ enabled: true, events })).toEqual({
      enabled: true,
      events,
    });
    expect(pushCatalog({ enabled: "yes", events })).toBeNull();
    expect(pushCatalog({ enabled: true, events: [{ id: 1 }] })).toBeNull();
  });
});

describe("screen shapes", () => {
  test("accept the parts each screen reads first", () => {
    expect(driveList({ summary: [], sections: [] })).not.toBeNull();
    expect(driveList({ summary: [] })).toBeNull();
    expect(
      overviewPage({
        car,
        activity: { label: "Online" },
        callouts: [],
        menu: [],
        stats: [],
      }),
    ).not.toBeNull();
    const overview = {
      car,
      activity: { label: "Online" },
      callouts: [],
      menu: [],
      stats: [],
    };
    const strip = { segments: [], now: 0.5, hours: [] };
    expect(overviewPage({ ...overview, today: strip })).not.toBeNull();
    expect(
      overviewPage({
        ...overview,
        today: { ...strip, legend: [{ kind: "now", label: "Now" }] },
      }),
    ).not.toBeNull();
    expect(
      overviewPage({ ...overview, today: { ...strip, legend: "Now" } }),
    ).toBeNull();
    const location = { latitude: 33.4, longitude: -111.9, lastSeen: "Today" };
    expect(overviewPage({ ...overview, location })).not.toBeNull();
    expect(
      overviewPage({
        ...overview,
        location: { ...location, place: "Home", since: null },
      }),
    ).not.toBeNull();
    expect(
      overviewPage({ ...overview, location: { ...location, place: 4 } }),
    ).toBeNull();
    expect(overviewPage({ car })).toBeNull();
    expect(
      overviewPage({ car, activity: { label: "Online" }, stats: [] }),
    ).toBeNull();
    expect(
      chargeDetail({ title: "Home", hero: [], charts: [] }),
    ).not.toBeNull();
    expect(chargeDetail({ title: 4, hero: [], charts: [] })).toBeNull();
    expect(
      insightPage({ title: "Battery", hero: [], sections: [] }),
    ).not.toBeNull();
    expect(insightPage([])).toBeNull();
  });

  test("checks each settings group and the choices of a choice item", () => {
    const item = { key: "distance", label: "Distance", kind: "choice" };
    expect(
      settingsPage({
        preview: [],
        groups: [{ title: "Units", items: [{ ...item, options: [] }] }],
      }),
    ).not.toBeNull();
    expect(
      settingsPage({
        preview: [],
        groups: [{ title: "Units", items: [item] }],
      }),
    ).toBeNull();
    expect(settingsPage({ preview: [], groups: [null] })).toBeNull();
  });

  test("check the sign-in answers of pairing", () => {
    const user = { name: "Ege", email: "ege@example.com", role: "admin" };
    expect(
      pairClaim({
        token: "t",
        check: "0421",
        status: "pending",
        user: { name: "Ege" },
      }),
    ).not.toBeNull();
    expect(
      pairClaim({ token: "t", status: "pending", user: { name: "Ege" } }),
    ).toBeNull();
    expect(pairClaim({ token: "t", status: "active", user: {} })).toBeNull();
    expect(pairStatus({ status: "active", user })).not.toBeNull();
    expect(pairStatus({ status: "pending" })).not.toBeNull();
    expect(pairStatus({ status: "active" })).toBeNull();
    expect(
      pairStatus({ status: "active", user: { ...user, role: "x" } }),
    ).toBeNull();
    expect(appMe({ user, device: { name: null } })).not.toBeNull();
    expect(appMe({ user })).toBeNull();
  });
});

describe("basemapKeyOf", () => {
  test("takes a plausible key from the Settings and nothing else", () => {
    const page = { preview: [], groups: [] };
    expect(basemapKeyOf({ ...page, basemapKey: "abc123_KEY-value" })).toBe(
      "abc123_KEY-value",
    );
    expect(
      basemapKeyOf({ ...page, basemapKey: "no spaces allowed" }),
    ).toBeNull();
    expect(basemapKeyOf(page)).toBeNull();
    expect(basemapKeyOf(null)).toBeNull();
  });
});

describe("the new screens", () => {
  test("check the year, the timeline, and the report", () => {
    expect(
      yearPage({
        title: "Year in review",
        years: [2026],
        hero: [],
        heroBlocks: [],
        sections: [],
      }),
    ).not.toBeNull();
    expect(yearPage({ title: "x", years: ["2026"] })).toBeNull();
    const timeline = {
      day: "2026-10-17",
      title: "Yesterday",
      previous: "2026-10-16",
      next: "2026-10-18",
      stats: [],
      strip: { segments: [], now: 0, hours: [] },
      rows: [],
    };
    expect(timelinePage(timeline)).not.toBeNull();
    expect(timelinePage({ ...timeline, next: 3 })).toBeNull();
    const withKey = {
      ...timeline,
      strip: {
        ...timeline.strip,
        legend: [
          { kind: "drive", label: "Driving" },
          { kind: "now", label: "Now" },
        ],
      },
      lastActive: {
        day: "2026-10-15",
        title: "No drive and no charge on this day",
        detail: "Open the last day with one: Thu 15 Oct",
      },
    };
    expect(timelinePage(withKey)).not.toBeNull();
    expect(timelinePage({ ...withKey, lastActive: null })).not.toBeNull();
    expect(timelinePage({ ...withKey, lastActive: { day: 3 } })).toBeNull();
    expect(
      timelinePage({
        ...withKey,
        lastActive: { ...withKey.lastActive, day: "../settings" },
      }),
    ).toBeNull();
    expect(
      timelinePage({ ...withKey, strip: { ...timeline.strip, legend: [1] } }),
    ).toBeNull();
    const report = {
      presets: [],
      stats: [],
      routes: null,
      markers: [],
      sections: [],
      exports: [
        { label: "Drives CSV", path: "/api/cars/2/drives.csv", file: "a.csv" },
      ],
    };
    expect(reportPage(report)).not.toBeNull();
    expect(
      reportPage({
        ...report,
        exports: [{ label: "x", path: "https://evil.example/x", file: "x" }],
      }),
    ).toBeNull();
  });
});
