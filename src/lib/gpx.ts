export type GpxPoint = {
  lat: number;
  lng: number;
  at: number;
  elevationM: number | null;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function coordinate(value: number): string {
  return value.toFixed(6);
}

export function driveGpx(name: string, points: GpxPoint[]): string {
  const title = escapeXml(name);
  const start = points[0] ? new Date(points[0].at).toISOString() : null;
  const trackPoints = points.map((point) => {
    const elevation =
      point.elevationM === null
        ? ""
        : `<ele>${point.elevationM.toFixed(1)}</ele>`;
    return `      <trkpt lat="${coordinate(point.lat)}" lon="${coordinate(point.lng)}">${elevation}<time>${new Date(point.at).toISOString()}</time></trkpt>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="My Tesla" xmlns="http://www.topografix.com/GPX/1/1">',
    `  <metadata><name>${title}</name>${start ? `<time>${start}</time>` : ""}</metadata>`,
    "  <trk>",
    `    <name>${title}</name>`,
    "    <type>driving</type>",
    "    <trkseg>",
    ...trackPoints,
    "    </trkseg>",
    "  </trk>",
    "</gpx>",
    "",
  ].join("\n");
}

export function gpxFileName(driveId: number, startAt: Date): string {
  return `my-tesla-drive-${driveId}-${startAt.toISOString().slice(0, 10)}.gpx`;
}
