import type { AppStat } from "@contract";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { space } from "@/theme/tokens";
import { toneColor } from "@/theme/tones";
import { usePalette } from "@/theme/use-palette";
import { Icon } from "./icon";
import { icons } from "./icons";
import { Text } from "./text";

function statLabel(stat: AppStat): string {
  return [stat.label, stat.value.text, stat.detail].filter(Boolean).join(", ");
}

export function Stat({
  stat,
  size = "value",
}: {
  stat: AppStat;
  size?: "value" | "title";
}) {
  const palette = usePalette();
  const { value } = stat;
  const content = (
    <>
      <View style={styles.label}>
        <Text variant="label" numberOfLines={1} style={styles.labelText}>
          {stat.label}
        </Text>
        {value.note ? (
          <Icon name={icons.info} color={palette.mutedForeground} size={14} />
        ) : null}
      </View>
      <Text
        variant={size}
        color={toneColor(palette, value.tone)}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value.text}
      </Text>
      {stat.detail ? (
        <Text variant="caption" numberOfLines={2}>
          {stat.detail}
        </Text>
      ) : null}
    </>
  );
  if (!value.note) {
    return (
      <View accessible accessibilityLabel={statLabel(stat)} style={styles.stat}>
        {content}
      </View>
    );
  }
  const note = value.note;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={statLabel(stat)}
      accessibilityHint="Explains the value"
      onPress={() => Alert.alert(stat.label, note)}
      style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export function StatGrid({
  stats,
  size,
}: {
  stats: AppStat[];
  size?: "value" | "title";
}) {
  return (
    <View style={styles.grid}>
      {stats.map((stat) => (
        <Stat key={stat.label} stat={stat} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: { flexBasis: "45%", flexGrow: 1, minWidth: 0, gap: 2 },
  label: { flexDirection: "row", alignItems: "center", gap: space.xs },
  labelText: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: space.xl,
    columnGap: space.xl,
  },
});
