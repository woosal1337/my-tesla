import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { textCap } from "@/theme/text-size";
import { fonts, radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Text } from "./text";

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const palette = usePalette();
  return (
    <View style={styles.field}>
      <Text variant="label">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        maxFontSizeMultiplier={textCap}
        placeholderTextColor={palette.subtle}
        selectionColor={palette.primary}
        style={[
          styles.input,
          {
            backgroundColor: palette.card,
            color: palette.foreground,
            borderColor: palette.input,
          },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
  input: {
    minHeight: 44,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
});
