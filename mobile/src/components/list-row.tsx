import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { useLargeText } from "@/theme/use-text-size";
import { dottedLine } from "./summary-line";
import { Text } from "./text";

export function ListRow({
  label,
  onPress,
  start,
  title,
  subtitle,
  accessory,
  end,
  startWidth,
  selected,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  start?: ReactNode;
  title: ReactNode;
  subtitle?: string | null;
  accessory?: ReactNode;
  end?: ReactNode;
  startWidth?: number;
  selected?: boolean;
  disabled?: boolean;
}) {
  const palette = usePalette();
  const stacked = useLargeText() && Boolean(start) && startWidth === undefined;
  const rowStyle = stacked ? [styles.row, styles.stackedRow] : styles.row;
  const body = (
    <>
      {start ? (
        <View
          style={
            stacked
              ? styles.stackedLine
              : startWidth === undefined
                ? styles.start
                : { width: startWidth }
          }
        >
          {start}
        </View>
      ) : null}
      <View style={stacked ? styles.stackedMiddle : styles.middle}>
        {typeof title === "string" ? (
          <Text variant="strong">{title}</Text>
        ) : (
          title
        )}
        {subtitle ? <Text variant="label">{dottedLine(subtitle)}</Text> : null}
        {accessory}
      </View>
      {end ? (
        <View style={stacked ? styles.stackedLine : styles.end}>{end}</View>
      ) : null}
    </>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} style={rowStyle}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: palette.accent }}
      style={({ pressed }) => [
        rowStyle,
        pressed && { backgroundColor: palette.card },
      ]}
    >
      {body}
    </Pressable>
  );
}

export function RowTime({
  clock,
  caption,
}: {
  clock: string;
  caption: string;
}) {
  return (
    <>
      <Text variant="strong" style={styles.tabular}>
        {clock}
      </Text>
      <Text variant="caption" style={styles.tabular}>
        {caption}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 64,
    marginHorizontal: -space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  stackedRow: { flexDirection: "column", alignItems: "stretch", gap: space.xs },
  start: { width: 76 },
  middle: { flex: 1, minWidth: 0 },
  stackedMiddle: { minWidth: 0 },
  end: { alignItems: "flex-end", maxWidth: "35%" },
  stackedLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: space.md,
  },
  tabular: { fontVariant: ["tabular-nums"] },
});
