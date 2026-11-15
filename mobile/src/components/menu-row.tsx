import { Pressable, StyleSheet, View } from "react-native";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Icon } from "./icon";
import { icons, type IconName } from "./icons";
import { Text } from "./text";

export function MenuRow({
  icon,
  title,
  subtitle,
  selected = false,
  chevron = false,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle?: string | null;
  selected?: boolean;
  chevron?: boolean;
  onPress: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ selected }}
      onPress={onPress}
      android_ripple={{ color: palette.accent }}
      style={({ pressed }) => [
        styles.row,
        chevron && styles.flush,
        selected && { backgroundColor: palette.card },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.icon}>
        <Icon name={icon} color={palette.foreground} size={22} />
      </View>
      <View style={styles.text}>
        <Text variant="menu">{title}</Text>
        {subtitle ? <Text variant="label">{subtitle}</Text> : null}
      </View>
      {chevron ? (
        <Icon name={icons.chevron} color={palette.subtle} size={14} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    minHeight: 64,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  flush: { paddingHorizontal: 0 },
  pressed: { opacity: 0.6 },
  icon: { width: 28, alignItems: "center" },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
