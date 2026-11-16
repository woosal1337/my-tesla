import { StyleSheet, View } from "react-native";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Text } from "./text";

export function SectionHeading({
  title,
  label,
}: {
  title: string;
  label: string;
}) {
  const palette = usePalette();
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={label}
      style={[styles.heading, { backgroundColor: palette.background }]}
    >
      <Text variant="label">{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginHorizontal: -space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
});
