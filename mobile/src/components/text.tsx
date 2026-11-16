import {
  StyleSheet,
  Text as NativeText,
  type TextProps as NativeTextProps,
} from "react-native";
import type { Palette } from "@/theme/palette";
import { largeTextCap, textCap } from "@/theme/text-size";
import { fonts } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

const variants = StyleSheet.create({
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  strong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  menu: { fontFamily: fonts.medium, fontSize: 17, lineHeight: 22 },
  value: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 28,
    fontVariant: ["tabular-nums"],
  },
  heading: { fontFamily: fonts.medium, fontSize: 24, lineHeight: 30 },
  title: { fontFamily: fonts.medium, fontSize: 32, lineHeight: 40 },
  display: { fontFamily: fonts.medium, fontSize: 40, lineHeight: 48 },
  hero: {
    fontFamily: fonts.medium,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1,
    fontVariant: ["tabular-nums"],
  },
});

type Variant = keyof typeof variants;

const defaultTones: Record<Variant, keyof Palette> = {
  body: "foreground",
  label: "mutedForeground",
  caption: "subtle",
  strong: "foreground",
  menu: "foreground",
  value: "foreground",
  heading: "foreground",
  title: "foreground",
  display: "foreground",
  hero: "foreground",
};

const largeVariants = new Set<Variant>(["hero", "display", "title"]);

type TextProps = NativeTextProps & {
  variant?: Variant;
  tone?: keyof Palette;
  color?: string;
};

export function Text({
  variant = "body",
  tone,
  color,
  style,
  ...props
}: TextProps) {
  const palette = usePalette();
  return (
    <NativeText
      maxFontSizeMultiplier={
        largeVariants.has(variant) ? largeTextCap : textCap
      }
      style={[
        variants[variant],
        { color: color ?? palette[tone ?? defaultTones[variant]] },
        style,
      ]}
      {...props}
    />
  );
}
