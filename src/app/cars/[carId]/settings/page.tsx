import type { Metadata } from "next";
import { PageTransition } from "@/components/page-transition";
import { SettingsForm } from "@/components/settings/settings-form";
import { requireCar } from "@/lib/car-route";
import { listCars } from "@/lib/queries";
import { readTimeZone } from "@/lib/time-zone";
import { baseline, currentViewer, getPreferences } from "@/lib/viewer";

export const instant = false;

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({
  params,
}: PageProps<"/cars/[carId]/settings">) {
  const [, preferences, defaults, cars, viewer] = await Promise.all([
    requireCar(params),
    getPreferences(),
    baseline(),
    listCars(),
    currentViewer(),
  ]);

  return (
    <PageTransition>
      <SettingsForm
        initial={preferences}
        defaults={defaults}
        cars={cars.map((car) => ({ id: car.id, name: car.name }))}
        timeZones={Intl.supportedValuesOf("timeZone")}
        serverTimeZone={readTimeZone(process.env)}
        viewer={viewer === "owner" ? null : viewer}
      />
    </PageTransition>
  );
}
