import { connection } from "next/server";
import { toCsv } from "@/lib/csv";
import { exportCharges, exportDrives, findCar } from "@/lib/queries";
import {
  chargeHeader,
  chargeRow,
  csvFileName,
  driveHeader,
  driveRow,
  exportRange,
} from "@/lib/trip-log";
import { getFormatter, getPreferences } from "@/lib/viewer";

const kinds = { "drives.csv": "drives", "charges.csv": "charges" } as const;

export async function GET(
  request: Request,
  context: RouteContext<"/api/cars/[carId]/[file]">,
) {
  await connection();
  const { carId, file } = await context.params;
  const kind = Object.hasOwn(kinds, file)
    ? kinds[file as keyof typeof kinds]
    : null;
  const car = /^\d{1,5}$/.test(carId) ? await findCar(Number(carId)) : null;
  if (!kind || !car) return new Response(null, { status: 404 });
  const [f, preferences] = await Promise.all([
    getFormatter(),
    getPreferences(),
  ]);
  const search = new URL(request.url).searchParams;
  const range = exportRange(search.get("from"), search.get("to"), f.timeZone);
  if (range === "invalid") {
    return new Response("Use from and to as YYYY-MM-DD, with from before to.", {
      status: 400,
    });
  }
  const csv =
    kind === "drives"
      ? toCsv(
          driveHeader(f),
          (await exportDrives(car, range)).map((drive) => driveRow(drive, f)),
        )
      : toCsv(
          chargeHeader(
            preferences.currency === "none" ? null : preferences.currency,
          ),
          (await exportCharges(car.id, range)).map((charge) =>
            chargeRow(charge, f.timeZone),
          ),
        );
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFileName(kind, car.name, new Date())}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
