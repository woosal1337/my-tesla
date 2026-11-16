import type { AppTone, ChartColor, LiveTone } from "@contract";
import type { Palette } from "./palette";

export function toneColor(palette: Palette, tone: AppTone | null): string {
  if (tone === "good") return palette.good;
  if (tone === "bad") return palette.bad;
  if (tone === "warning") return palette.warning;
  return palette.foreground;
}

export function liveToneColor(palette: Palette, tone: LiveTone): string {
  const colors: Record<LiveTone, string> = {
    normal: palette.mutedForeground,
    active: palette.primary,
    charge: palette.charge,
    warning: palette.warning,
  };
  return colors[tone];
}

export function chartColor(palette: Palette, color: ChartColor): string {
  return palette[color];
}
