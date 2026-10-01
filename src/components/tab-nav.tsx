"use client";

import {
  BatteryCharging,
  BatteryMedium,
  ChartNoAxesColumn,
  Gauge,
  MapPin,
  Route,
  Settings,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PendingTrace } from "@/components/navigation-pending";
import { cn } from "@/lib/utils";
import { tabDirection, tabFromPath, tabs, type TabId } from "@/lib/vehicle";

const icons: Record<TabId, typeof Gauge> = {
  overview: Gauge,
  drives: Route,
  charging: BatteryCharging,
  battery: BatteryMedium,
  stats: ChartNoAxesColumn,
  places: MapPin,
  settings: Settings,
};

export const tabSpring = {
  type: "spring",
  stiffness: 520,
  damping: 42,
  mass: 0.8,
} as const;

function useTabs(carId: number, visible: readonly TabId[]) {
  const pathname = usePathname();
  const current = tabFromPath(pathname, carId);
  const shown = tabs.filter(
    (tab) => visible.includes(tab.id) || tab.id === current,
  );
  return shown.map((tab) => {
    const direction = tabDirection(current, tab.id);
    return {
      ...tab,
      href: `/cars/${carId}${tab.segment}`,
      active: tab.id === current,
      transitionTypes: direction ? [direction] : undefined,
    };
  });
}

type TabsProps = { carId: number; visible: readonly TabId[] };

export function TabNav({ carId, visible }: TabsProps) {
  const items = useTabs(carId, visible);
  return (
    <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
      {items.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          transitionTypes={tab.transitionTypes}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "relative rounded px-3 py-1.5 text-sm font-medium transition-tesla lg:px-4",
            tab.active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.active && (
            <motion.span
              layoutId="tab-highlight"
              transition={tabSpring}
              className="absolute inset-0 rounded bg-accent"
            />
          )}
          <span className="relative">{tab.label}</span>
          <PendingTrace className="inset-x-3 -bottom-1" />
        </Link>
      ))}
    </nav>
  );
}

export function TabBar({ carId, visible }: TabsProps) {
  const items = useTabs(carId, visible);
  return (
    <nav
      aria-label="Sections"
      style={{ viewTransitionName: "tab-bar" }}
      className="fixed inset-x-0 bottom-0 z-50 bg-background/80 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur-xl md:hidden"
    >
      <div
        className="mx-auto grid max-w-lg px-2 pt-2"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((tab) => {
          const Icon = icons[tab.id];
          return (
            <Link
              key={tab.id}
              href={tab.href}
              transitionTypes={tab.transitionTypes}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-1 rounded py-1.5 text-[10px] font-medium transition-tesla",
                tab.active ? "text-foreground" : "text-subtle",
              )}
            >
              {tab.active && (
                <motion.span
                  layoutId="tab-bar-highlight"
                  transition={tabSpring}
                  className="absolute -top-2 h-0.5 w-6 rounded-full bg-foreground"
                />
              )}
              <Icon className="size-5" strokeWidth={1.75} />
              {tab.label}
              <PendingTrace className="inset-x-3 bottom-0" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
