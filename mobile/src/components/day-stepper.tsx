import { Pressable, StyleSheet, View } from "react-native";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { icons } from "./icons";
import { StepButton } from "./step-button";
import { Text } from "./text";

const titleTextCap = 2;

export function DayStepper({
  title,
  onPrevious,
  onNext,
  onToday,
}: {
  title: string;
  onPrevious: () => void;
  onNext: (() => void) | null;
  onToday: (() => void) | null;
}) {
  const palette = usePalette();
  return (
    <View style={styles.row}>
      <Text
        variant="heading"
        accessibilityRole="header"
        maxFontSizeMultiplier={titleTextCap}
        style={styles.title}
      >
        {title}
      </Text>
      <View style={styles.controls}>
        {onToday ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Today"
            onPress={onToday}
            android_ripple={{ color: palette.accent, foreground: true }}
            style={({ pressed }) => [
              styles.today,
              { backgroundColor: palette.card },
              pressed && styles.pressed,
            ]}
          >
            <Text variant="strong">Today</Text>
          </Pressable>
        ) : null}
        <StepButton
          icon={icons.chevronLeft}
          label="Day before"
          onPress={onPrevious}
        />
        <StepButton icon={icons.chevron} label="Day after" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: space.md,
    rowGap: space.sm,
  },
  title: { flexGrow: 1, flexShrink: 0 },
  controls: { flexDirection: "row", gap: space.sm, marginLeft: "auto" },
  today: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.control,
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: { opacity: 0.6 },
});
