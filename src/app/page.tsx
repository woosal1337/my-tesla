import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { Landing } from "@/components/landing/landing";
import { isDemoMode } from "@/lib/demo/mode";
import { repositoryStars } from "@/lib/github";
import { project } from "@/lib/project";
import { autoCar } from "@/lib/preferences";
import { defaultCarId, listCars } from "@/lib/queries";
import { getPreferences } from "@/lib/viewer";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  if (!isDemoMode()) return {};
  return {
    title: {
      absolute: `${project.name} · A dashboard for your TeslaMate data`,
    },
    description:
      "A self-hosted, read-only dashboard for the car data that TeslaMate records. Try the demo with 60 days of synthetic data.",
    robots: { index: true, follow: true },
  };
}

async function startCarId(): Promise<number | null> {
  const { defaultCar } = await getPreferences();
  if (defaultCar !== autoCar) {
    const cars = await listCars();
    const chosen = cars.find((car) => String(car.id) === defaultCar);
    if (chosen) return chosen.id;
  }
  return defaultCarId();
}

export default async function Home() {
  await connection();
  if (isDemoMode()) return <Landing stars={await repositoryStars()} />;
  const carId = await startCarId();
  if (carId !== null) redirect(`/cars/${carId}`);
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-5">
      <EmptyState title="No cars yet">
        Sign in to TeslaMate with your Tesla account. Your cars appear here
        after TeslaMate finds them.
      </EmptyState>
    </main>
  );
}
