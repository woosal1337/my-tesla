import type { LiveIcon } from "@contract";
import type { AndroidSymbol, SFSymbol } from "expo-symbols";

export type IconName = { ios: SFSymbol; android: AndroidSymbol };

export const icons = {
  check: { ios: "checkmark", android: "check" },
  chevron: { ios: "chevron.right", android: "chevron_right" },
  chevronLeft: { ios: "chevron.left", android: "chevron_left" },
  warning: { ios: "exclamationmark.triangle.fill", android: "warning" },
  info: { ios: "info.circle", android: "info" },
  drive: {
    ios: "point.topleft.down.to.point.bottomright.curvepath.fill",
    android: "route",
  },
  charge: { ios: "bolt.fill", android: "bolt" },
  stop: { ios: "parkingsign.circle.fill", android: "local_parking" },
  chevronDown: { ios: "chevron.down", android: "expand_more" },
  chevronUp: { ios: "chevron.up", android: "expand_less" },
  battery: { ios: "battery.75percent", android: "battery_5_bar" },
  stats: { ios: "chart.bar.fill", android: "bar_chart" },
  places: { ios: "mappin.and.ellipse", android: "location_on" },
  location: { ios: "location.fill", android: "near_me" },
  status: { ios: "lock.shield.fill", android: "security" },
  settings: { ios: "gearshape.fill", android: "settings" },
  timeline: { ios: "clock.fill", android: "schedule" },
  report: { ios: "doc.text.fill", android: "description" },
  maps: { ios: "map.fill", android: "map" },
  year: { ios: "calendar", android: "calendar_month" },
} as const satisfies Record<string, IconName>;

export const liveIcons: Record<LiveIcon, IconName> = {
  lock: { ios: "lock.fill", android: "lock" },
  "lock-open": { ios: "lock.open.fill", android: "lock_open" },
  "door-closed": { ios: "door.left.hand.closed", android: "door_front" },
  "door-open": { ios: "door.left.hand.open", android: "door_open" },
  plug: { ios: "powerplug.fill", android: "power" },
  "plug-zap": { ios: "bolt.fill", android: "bolt" },
  unplug: { ios: "bolt.slash.fill", android: "power_off" },
  fan: { ios: "fan.fill", android: "mode_fan" },
  "badge-check": { ios: "checkmark.seal.fill", android: "verified" },
  download: { ios: "arrow.down.circle.fill", android: "download" },
  gauge: { ios: "gauge.with.dots.needle.67percent", android: "speed" },
  navigation: { ios: "location.fill", android: "navigation" },
  shield: { ios: "shield.fill", android: "shield" },
  "shield-off": { ios: "shield.slash.fill", android: "remove_moderator" },
};
