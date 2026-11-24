import Link from "next/link";
import { ActivityIsland } from "@/components/activity-island";
import { BasemapKeyProvider } from "@/components/basemap-key";
import { CanonicalCarPath } from "@/components/canonical-car-path";
import { CarSwitcher } from "@/components/car-switcher";
import { DemoBanner } from "@/components/demo-banner";
import { LiveRefresh } from "@/components/live-refresh";
import { MotionPreference } from "@/components/motion-preference";
import {
  HeaderMark,
  NavigationPendingProvider,
} from "@/components/navigation-pending";
import { TabBar, TabNav } from "@/components/tab-nav";
import { currentSession } from "@/lib/auth/session";
import { basemapKey } from "@/lib/basemap";
import { requireCar } from "@/lib/car-route";
import { carPath } from "@/lib/car-slug";
import { isDemoMode } from "@/lib/demo/mode";
import { islandActivity } from "@/lib/live/island";
import { getLive } from "@/lib/live/live";
import { tabKeys } from "@/lib/preferences";
import { listCars } from "@/lib/queries";
import { variantLine, type TabId } from "@/lib/vehicle";
import { getFormatter, getPreferences } from "@/lib/viewer";

export default async function CarLayout({
  children,
  params,
}: LayoutProps<"/cars/[carId]">) {
  const [car, cars, preferences, signedIn, f] = await Promise.all([
    requireCar(params),
    listCars(),
    getPreferences(),
    currentSession(),
    getFormatter(),
  ]);
  const live = preferences.overview.live ? await getLive(car.id) : null;
  const renderedAt = new Date().getTime();
  const activity = live?.connected ? islandActivity(live.view, f) : null;
  const visible: TabId[] = [
    "overview",
    ...tabKeys.filter((tab) => preferences.tabs[tab.id]).map((tab) => tab.id),
    "settings",
  ];
  const options = cars.map((option) => ({
    id: option.id,
    name: option.name,
    detail: variantLine(option),
    path: carPath(option),
  }));

  return (
    <BasemapKeyProvider value={basemapKey(process.env)}>
      <MotionPreference reduced={preferences.motion === "reduced"}>
        <NavigationPendingProvider>
          <CanonicalCarPath slug={car.slug} />
          {isDemoMode() && <DemoBanner />}
          <header
            style={{ viewTransitionName: "site-header" }}
            className="sticky top-0 z-50 bg-background/75 backdrop-blur-xl"
          >
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-5">
              <div className="flex min-w-0 items-center gap-2">
                <Link
                  href={carPath(car)}
                  className="grid size-9 place-items-center rounded transition-tesla hover:bg-accent"
                >
                  <HeaderMark />
                </Link>
                <CarSwitcher cars={options} currentId={car.id} />
              </div>
              <TabNav basePath={carPath(car)} visible={visible} />
              <div className="flex justify-end lg:w-32">
                {signedIn && (
                  <Link
                    href="/account"
                    aria-label={`Account of ${signedIn.user.name}`}
                    className="grid size-9 place-items-center rounded-full bg-card text-sm font-medium transition-tesla hover:bg-accent"
                  >
                    {signedIn.user.name.trim().charAt(0).toUpperCase() || "?"}
                  </Link>
                )}
              </div>
            </div>
            <ActivityIsland
              activity={activity}
              href={carPath(car)}
              renderedAt={renderedAt}
            />
          </header>
          <main className="mx-auto w-full max-w-5xl px-5 pb-32 md:pb-20">
            {children}
          </main>
          <TabBar basePath={carPath(car)} visible={visible} />
          {preferences.refresh !== "off" && (
            <LiveRefresh intervalMs={Number(preferences.refresh) * 1000} />
          )}
        </NavigationPendingProvider>
      </MotionPreference>
    </BasemapKeyProvider>
  );
}
