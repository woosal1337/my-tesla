import { Pressable, StyleSheet } from "react-native";
import { radius } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Icon } from "./icon";
import type { IconName } from "./icons";

export function StepButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: (() => void) | null;
}) {
  const palette = usePalette();
  const disabled = onPress === null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress ?? undefined}
      android_ripple={{ color: palette.accent, foreground: true }}
      style={({ pressed }) => [
        styles.step,
        !disabled && { backgroundColor: palette.card },
        pressed && styles.pressed,
      ]}
    >
      <Icon
        name={icon}
        color={disabled ? palette.subtle : palette.foreground}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  step: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: { opacity: 0.6 },
});
