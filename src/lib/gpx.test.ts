import { describe, expect, test } from "bun:test";
import { driveGpx, gpxFileName } from "./gpx";

const points = [
  {
    lat: 33.4255,
    lng: -111.94,
    at: Date.UTC(2026, 8, 20, 15, 26),
    elevationM: 352,
  },
  {
    lat: 33.43,
    lng: -111.9,
    at: Date.UTC(2026, 8, 20, 15, 27),
    elevationM: null,
  },
];

describe("driveGpx", () => {
  test("writes a GPX 1.1 track with times and elevation", () => {
    const gpx = driveGpx("Home", points);
    expect(gpx.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(gpx).toContain('<gpx version="1.1" creator="My Tesla"');
    expect(gpx).toContain("<time>2026-09-20T15:26:00.000Z</time></metadata>");
    expect(gpx).toContain(
      '<trkpt lat="33.425500" lon="-111.940000"><ele>352.0</ele><time>2026-09-20T15:26:00.000Z</time></trkpt>',
    );
    expect(gpx).toContain(
      '<trkpt lat="33.430000" lon="-111.900000"><time>2026-09-20T15:27:00.000Z</time></trkpt>',
    );
    expect(gpx.match(/<trkpt /g)).toHaveLength(2);
  });

  test("escapes the drive name", () => {
    expect(driveGpx(`Tom's "Café" <Lot> & Co`, points)).toContain(
      "<name>Tom&apos;s &quot;Café&quot; &lt;Lot&gt; &amp; Co</name>",
    );
  });

  test("writes an empty track for a drive without points", () => {
    const gpx = driveGpx("Home", []);
    expect(gpx).toContain("<metadata><name>Home</name></metadata>");
    expect(gpx).not.toContain("<trkpt");
  });
});

describe("gpxFileName", () => {
  test("names the file with the drive and the UTC date", () => {
    expect(gpxFileName(140, new Date(Date.UTC(2026, 8, 20, 15, 26)))).toBe(
      "my-tesla-drive-140-2026-09-20.gpx",
    );
  });
});
