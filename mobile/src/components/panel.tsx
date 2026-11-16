import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { useLargeText } from "@/theme/use-text-size";
import { OnCard } from "./surface";
import { Text } from "./text";

export function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note?: string | null;
  children: ReactNode;
}) {
  const palette = usePalette();
  const large = useLargeText();
  return (
    <View style={[styles.panel, { backgroundColor: palette.card }]}>
      <View style={large ? styles.stackedHeader : styles.header}>
        <Text variant="label" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {note ? (
          <Text variant="caption" style={!large && styles.note}>
            {note}
          </Text>
        ) : null}
      </View>
      <View style={styles.body}>
        <OnCard value>{children}</OnCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: radius.card,
    borderCurve: "continuous",
    padding: space.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.lg,
  },
  stackedHeader: { alignItems: "flex-start", gap: 2 },
  title: { flexShrink: 0 },
  note: { flexShrink: 1, textAlign: "right" },
  body: { marginTop: space.lg, gap: space.lg },
});
