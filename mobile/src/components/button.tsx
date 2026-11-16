import { use } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { OnCard } from "./surface";
import { Text } from "./text";

export function Button({
  label,
  onPress,
  kind = "primary",
  busy = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary";
  busy?: boolean;
  disabled?: boolean;
}) {
  const palette = usePalette();
  const primary = kind === "primary";
  const secondaryColor = use(OnCard) ? palette.background : palette.card;
  const inactive = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: palette.accent, foreground: true }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? palette.primary : secondaryColor },
        pressed && styles.pressed,
        disabled && !busy && styles.off,
      ]}
    >
      {busy ? (
        <ActivityIndicator
          color={primary ? palette.primaryForeground : palette.foreground}
        />
      ) : (
        <Text
          variant="strong"
          tone={primary ? "primaryForeground" : "secondaryForeground"}
          style={styles.label}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.control,
    paddingHorizontal: space.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: { paddingVertical: space.sm, textAlign: "center" },
  pressed: { opacity: 0.6 },
  off: { opacity: 0.38 },
});
