import { overviewPage } from "@/lib/app/overview";
import { appContext, appJson, appNotFound } from "@/lib/app/request";
import { capacityHistory } from "@/lib/battery-data";
import { carImage } from "@/lib/car-image";
import { lockHistory } from "@/lib/history/recorder";
import { dayWindow, localDayKey, periodStart } from "@/lib/insights";
import { getLive } from "@/lib/live/live";
import { visitedPlaces } from "@/lib/places-data";
import { carSnapshot, recentCharges, recentDrives } from "@/lib/queries";
import { driveTotals, recentTireLeaks } from "@/lib/stats-data";
import { dayRecords } from "@/lib/timeline-data";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/app/cars/[carId]/overview">,
) {
  const context = await appContext(params);
  if (!context) return appNotFound();
  const { car, f, preferences, showMaps, now } = context;
  const show = preferences.overview;
  const window = dayWindow(localDayKey(now, f.timeZone), f.timeZone);
  const from = periodStart(preferences.period, now);
  const [
    snapshot,
    [lastDrive],
    [lastCharge],
    today,
    live,
    leaks,
    capacity,
    driven,
    visited,
  ] = await Promise.all([
    carSnapshot(car.id),
    recentDrives(car, 1),
    recentCharges(car.id, 1),
    show.today
      ? dayRecords(car.id, window.start, window.end)
      : Promise.resolve(null),
    getLive(car.id),
    show.tires ? recentTireLeaks(car.id, f.timeZone) : Promise.resolve([]),
    capacityHistory(car.id),
    driveTotals(car.id, from),
    visitedPlaces(car.id, from),
  ]);
  const render = carImage(car);
  return appJson(
    overviewPage(
      {
        car,
        image: render?.url ?? null,
        imageFrame: render?.frame ?? null,
        snapshot,
        lastDrive: lastDrive ?? null,
        lastCharge: lastCharge ?? null,
        today: today ? { ...today, ...window } : null,
        live,
        leaks,
        history: show.live ? lockHistory(car.id, now.getTime()) : null,
        show,
        showMaps,
        capacity,
        driven,
        visited,
        period: preferences.period,
      },
      f,
      now,
    ),
  );
}
