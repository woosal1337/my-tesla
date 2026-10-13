import "server-only";
import { connection } from "next/server";
import { database } from "./database";
import {
  drivesById,
  exportCharges,
  recentDrives,
  type Car,
  type Charge,
  type Drive,
} from "./queries";
import { buildTrips, newestFirst, type Trip } from "./trip";
import { tripLegsQuery, type TripSelection } from "./trip-legs-sql";

type Window = { start: Date; end: Date };

async function loadTrips(
  car: Car,
  selection: TripSelection,
  chargeWindow: (drives: Drive[]) => Window,
): Promise<{ trips: Trip[]; drives: Drive[]; charges: Charge[] }> {
  await connection();
  const legs = await tripLegsQuery(database(), { carId: car.id, selection });
  const drives = await drivesById(
    car,
    legs.map((leg) => leg.driveId),
  );
  const charges = await exportCharges(car.id, chargeWindow(drives));
  return { trips: buildTrips(legs, drives, charges), drives, charges };
}

function latestEnd(drives: Drive[], fallback: Date): Date {
  return drives.reduce(
    (latest, drive) => (drive.endAt > latest ? drive.endAt : latest),
    fallback,
  );
}

export function tripsInRange(car: Car, range: Window) {
  return loadTrips(car, { range }, (drives) => ({
    start: range.start,
    end: latestEnd(drives, range.end),
  }));
}

export async function recentTrips(car: Car): Promise<Trip[]> {
  const drives = await recentDrives(car);
  const oldest = drives.at(-1);
  if (!oldest) return [];
  const { trips } = await tripsInRange(car, {
    start: oldest.startAt,
    end: new Date(),
  });
  return newestFirst(trips);
}

export async function findTrip(
  car: Car,
  driveId: number,
): Promise<Trip | null> {
  const { trips } = await loadTrips(car, { driveId }, (drives) => ({
    start: drives.reduce(
      (earliest, drive) =>
        drive.startAt < earliest ? drive.startAt : earliest,
      drives[0]?.startAt ?? new Date(0),
    ),
    end: latestEnd(drives, new Date(0)),
  }));
  return trips[0] ?? null;
}
