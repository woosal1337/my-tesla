import { appContext, appJson, appNotFound } from "@/lib/app/request";
import { timelinePage } from "@/lib/app/timeline";
import { dayWindow, localDayKey, parseDayKey } from "@/lib/insights";
import { dayRecords, lastActivityBefore } from "@/lib/timeline-data";
import { isQuietDay } from "@/lib/timeline-view";

export async function GET(
  request: Request,
  { params }: RouteContext<"/api/app/cars/[carId]/timeline">,
) {
  const context = await appContext(params);
  if (!context) return appNotFound();
  const { car, f, now } = context;
  const today = localDayKey(now, f.timeZone);
  const requested = parseDayKey(
    new URL(request.url).searchParams.get("day") ?? undefined,
  );
  const day = requested && requested <= today ? requested : today;
  const window = dayWindow(day, f.timeZone);
  const records = await dayRecords(car.id, window.start, window.end);
  const lastActivity = isQuietDay(records)
    ? await lastActivityBefore(car.id, window.start)
    : null;
  return appJson(
    timelinePage(records, day, today, window, f, now, lastActivity),
  );
}
