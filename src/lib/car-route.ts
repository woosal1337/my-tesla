import "server-only";
import { notFound } from "next/navigation";
import { findCar } from "./queries";

export async function requireCar(params: Promise<{ carId: string }>) {
  const { carId } = await params;
  const id = /^\d{1,5}$/.test(carId) ? Number(carId) : Number.NaN;
  const car = Number.isInteger(id) ? await findCar(id) : null;
  if (!car) notFound();
  return car;
}
