import type { AppDayStrip, DayKind } from "@contract";
import { StyleSheet, View } from "react-native";
import type { Palette } from "@/theme/palette";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Text } from "./text";

function dayColors(palette: Palette): Record<DayKind, string> {
  return {
    drive: palette.primary,
    charge: palette.charge,
    online: palette.subtle,
    asleep: `${palette.subtle}59`,
    offline: `${palette.subtle}26`,
  };
}

function LegendSwatch({ color }: { color: string | null }) {
  const palette = usePalette();
  if (color === null) {
    return (
      <View style={styles.swatch}>
        <View
          style={[styles.nowMark, { backgroundColor: palette.foreground }]}
        />
      </View>
    );
  }
  return (
    <View style={[styles.swatch, { backgroundColor: palette.background }]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />
    </View>
  );
}

export function DayStrip({
  today,
  label,
}: {
  today: AppDayStrip;
  label: string;
}) {
  const palette = usePalette();
  const colors: Record<string, string | undefined> = dayColors(palette);
  const legend = (today.legend ?? []).filter(
    (entry) => entry.kind === "now" || colors[entry.kind] !== undefined,
  );
  return (
    <View accessible accessibilityLabel={label}>
      <View style={[styles.strip, { backgroundColor: palette.background }]}>
        {today.segments.map((segment) => (
          <View
            key={`${segment.kind}-${segment.start}`}
            style={[
              styles.segment,
              {
                left: `${segment.start * 100}%`,
                width: `${(segment.end - segment.start) * 100}%`,
                backgroundColor: colors[segment.kind],
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.now,
            {
              left: `${today.now * 100}%`,
              backgroundColor: palette.foreground,
            },
          ]}
        />
      </View>
      <View style={styles.hours}>
        {today.hours.map((hour, index) => (
          <Text key={`${hour}-${index}`} variant="caption" style={styles.hour}>
            {hour}
          </Text>
        ))}
      </View>
      {legend.length ? (
        <View style={styles.legend}>
          {legend.map((entry) => (
            <View key={entry.kind} style={styles.legendItem}>
              <LegendSwatch
                color={
                  entry.kind === "now" ? null : (colors[entry.kind] ?? null)
                }
              />
              <Text variant="caption" tone="mutedForeground">
                {entry.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { height: 32, borderRadius: radius.control, overflow: "hidden" },
  segment: { position: "absolute", top: 0, bottom: 0 },
  now: { position: "absolute", top: 0, bottom: 0, width: 2 },
  hours: {
    marginTop: space.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hour: { fontSize: 11, fontVariant: ["tabular-nums"] },
  legend: {
    marginTop: space.md,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: space.lg,
    rowGap: space.xs,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    overflow: "hidden",
    alignItems: "center",
  },
  nowMark: { width: 2, height: 10 },
});
