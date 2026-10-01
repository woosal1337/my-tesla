"use client";

import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { tabFromPath, tabs } from "@/lib/vehicle";

type CarOption = { id: number; name: string; detail: string };

export function CarSwitcher({
  cars,
  currentId,
}: {
  cars: CarOption[];
  currentId: number;
}) {
  const pathname = usePathname();
  const current = cars.find((car) => car.id === currentId);
  const segment =
    tabs.find((tab) => tab.id === tabFromPath(pathname, currentId))?.segment ??
    "";

  if (cars.length < 2) {
    return <span className="text-sm font-medium">{current?.name}</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium transition-tesla outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-accent">
        {current?.name}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {cars.map((car) => (
          <DropdownMenuItem
            key={car.id}
            render={
              <Link
                href={`/cars/${car.id}${segment}`}
                transitionTypes={
                  car.id === currentId ? undefined : ["car-swap"]
                }
              />
            }
            className="flex items-center justify-between gap-6 py-2"
          >
            <span className="flex flex-col">
              <span className="font-medium">{car.name}</span>
              <span className="text-xs text-muted-foreground">
                {car.detail}
              </span>
            </span>
            {car.id === currentId && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
