import { StyleSheet, View } from "react-native";
import { fonts, radius } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Text } from "./text";

export function ChargerBadge({ fast }: { fast: boolean }) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: fast ? `${palette.primary}26` : palette.muted },
      ]}
    >
      <Text
        variant="caption"
        tone={fast ? "primary" : "mutedForeground"}
        style={styles.text}
      >
        {fast ? "DC" : "AC"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.control,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginVertical: 2,
  },
  text: { fontSize: 11, fontFamily: fonts.medium },
});
