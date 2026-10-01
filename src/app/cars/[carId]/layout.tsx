import Link from "next/link";
import { CarSwitcher } from "@/components/car-switcher";
import { DemoBanner } from "@/components/demo-banner";
import { LiveRefresh } from "@/components/live-refresh";
import { MotionPreference } from "@/components/motion-preference";
import {
  HeaderMark,
  NavigationPendingProvider,
} from "@/components/navigation-pending";
import { TabBar, TabNav } from "@/components/tab-nav";
import { requireCar } from "@/lib/car-route";
import { isDemoMode } from "@/lib/demo/mode";
import { tabKeys } from "@/lib/preferences";
import { listCars } from "@/lib/queries";
import { variantLine, type TabId } from "@/lib/vehicle";
import { getPreferences } from "@/lib/viewer";

export default async function CarLayout({
  children,
  params,
}: LayoutProps<"/cars/[carId]">) {
  const [car, cars, preferences] = await Promise.all([
    requireCar(params),
    listCars(),
    getPreferences(),
  ]);
  const visible: TabId[] = [
    "overview",
    ...tabKeys.filter((tab) => preferences.tabs[tab.id]).map((tab) => tab.id),
    "settings",
  ];
  const options = cars.map((option) => ({
    id: option.id,
    name: option.name,
    detail: variantLine(option),
  }));

  return (
    <MotionPreference reduced={preferences.motion === "reduced"}>
      <NavigationPendingProvider>
        {isDemoMode() && <DemoBanner />}
        <header
          style={{ viewTransitionName: "site-header" }}
          className="sticky top-0 z-50 bg-background/75 backdrop-blur-xl"
        >
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={`/cars/${car.id}`}
                className="grid size-9 place-items-center rounded transition-tesla hover:bg-accent"
              >
                <HeaderMark />
              </Link>
              <CarSwitcher cars={options} currentId={car.id} />
            </div>
            <TabNav carId={car.id} visible={visible} />
            <div className="hidden w-32 lg:block" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl px-5 pb-32 md:pb-20">
          {children}
        </main>
        <TabBar carId={car.id} visible={visible} />
        {preferences.refresh !== "off" && (
          <LiveRefresh intervalMs={Number(preferences.refresh) * 1000} />
        )}
      </NavigationPendingProvider>
    </MotionPreference>
  );
}
