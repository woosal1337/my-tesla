"use client";

import { Moon, Sun } from "lucide-react";
import { useTransition } from "react";
import { saveTheme } from "@/app/cars/[carId]/settings/actions";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function currentTheme(): "light" | "dark" {
  const forced = document.documentElement.dataset.theme;
  if (forced === "light" || forced === "dark") return forced;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    trackEvent(analyticsEvents.themeChange, { theme: next });
    startTransition(async () => {
      await saveTheme(next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Switch between light and dark mode"
      aria-busy={pending}
      className={cn(
        "grid size-9 place-items-center rounded bg-card text-foreground transition-tesla hover:bg-accent",
        className,
      )}
    >
      <Sun aria-hidden className="hidden size-4 dark:block" />
      <Moon aria-hidden className="size-4 dark:hidden" />
    </button>
  );
}
