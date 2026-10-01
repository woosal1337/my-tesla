import { connection } from "next/server";
import { getLive } from "@/lib/live/live";
import { carSnapshot, findCar } from "@/lib/queries";
import { carSummary, wantsLocation } from "@/lib/summary";
import { getPreferences } from "@/lib/viewer";

export async function GET(
  request: Request,
  context: RouteContext<"/api/cars/[carId]/summary.json">,
) {
  await connection();
  const { carId } = await context.params;
  const car = /^\d{1,5}$/.test(carId) ? await findCar(Number(carId)) : null;
  if (!car) return Response.json({ error: "No such car." }, { status: 404 });
  const [snapshot, live, preferences] = await Promise.all([
    carSnapshot(car.id),
    getLive(car.id),
    getPreferences(),
  ]);
  const summary = carSummary({
    car,
    snapshot,
    live,
    rangeKind: preferences.range,
    includeLocation: wantsLocation(
      new URL(request.url).searchParams.get("location"),
    ),
    now: new Date(),
  });
  return Response.json(summary, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
