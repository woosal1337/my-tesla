import { Pressable, StyleSheet, View } from "react-native";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { useLargeText } from "@/theme/use-text-size";
import { Icon } from "./icon";
import type { IconName } from "./icons";
import { Text } from "./text";

export type QuickAction = {
  key: string;
  icon: IconName;
  label: string;
  onPress: () => void;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const palette = usePalette();
  const large = useLargeText();
  return (
    <View style={[styles.row, large && styles.grid]}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={action.onPress}
          hitSlop={8}
          style={({ pressed }) => [
            styles.action,
            large && styles.half,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.circle, { backgroundColor: palette.card }]}>
            <Icon name={action.icon} color={palette.foreground} size={22} />
          </View>
          <Text variant="caption" style={styles.caption}>
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
  },
  grid: { flexWrap: "wrap", justifyContent: "flex-start", rowGap: space.lg },
  action: { alignItems: "center", gap: space.sm, minWidth: 64 },
  half: { flexBasis: "50%" },
  caption: { textAlign: "center" },
  pressed: { opacity: 0.6 },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
