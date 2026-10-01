import { connection } from "next/server";
import { driveGpx, gpxFileName } from "@/lib/gpx";
import { drivePositions, findCar, findDriveRecord } from "@/lib/queries";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/cars/[carId]/drives/[file]">,
) {
  await connection();
  const { carId, file } = await context.params;
  const match = /^(\d{1,9})\.gpx$/.exec(file);
  const car = /^\d{1,5}$/.test(carId) ? await findCar(Number(carId)) : null;
  if (!match || !car) return new Response(null, { status: 404 });
  const driveId = Number(match[1]);
  const drive = await findDriveRecord(car, driveId);
  if (!drive) return new Response(null, { status: 404 });
  const points = await drivePositions(car.id, driveId);
  const name = `${drive.from} to ${drive.to}`;
  return new Response(driveGpx(name, points), {
    headers: {
      "Content-Type": "application/gpx+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${gpxFileName(driveId, drive.startAt)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
