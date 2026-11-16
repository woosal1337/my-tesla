import { useEffect, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type LayoutRectangle,
} from "react-native";
import { largeTextCap } from "@/theme/text-size";
import { motion, radius } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { useReducedMotion } from "@/theme/use-reduced-motion";
import { Text } from "./text";

type Item<Id extends string> = { id: Id; label: string };

export function SegmentedControl<Id extends string>({
  label,
  items,
  value,
  onChange,
  size = "regular",
}: {
  label: string;
  items: readonly Item<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  size?: "regular" | "compact";
}) {
  const palette = usePalette();
  const reduced = useReducedMotion();
  const [frames, setFrames] = useState<Partial<Record<Id, LayoutRectangle>>>(
    {},
  );
  const [left] = useState(() => new Animated.Value(0));
  const [width] = useState(() => new Animated.Value(0));
  const frame = frames[value];

  useEffect(() => {
    if (!frame) return;
    const duration = reduced ? 0 : motion.durationMs;
    Animated.parallel([
      Animated.timing(left, {
        toValue: frame.x,
        duration,
        easing: motion.easing,
        useNativeDriver: false,
      }),
      Animated.timing(width, {
        toValue: frame.width,
        duration,
        easing: motion.easing,
        useNativeDriver: false,
      }),
    ]).start();
  }, [frame, left, width, reduced]);

  const compact = size === "compact";
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={[styles.track, { backgroundColor: palette.card }]}
    >
      {frame ? (
        <Animated.View
          style={[
            styles.pill,
            { left, width, backgroundColor: palette.background },
          ]}
        />
      ) : null}
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            accessibilityShowsLargeContentViewer
            accessibilityLargeContentTitle={item.label}
            hitSlop={compact ? 8 : 4}
            onPress={() => onChange(item.id)}
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setFrames((current) => ({ ...current, [item.id]: layout }));
            }}
            style={[styles.item, compact && styles.compactItem]}
          >
            <Text
              variant="strong"
              tone={selected ? "foreground" : "mutedForeground"}
              numberOfLines={1}
              maxFontSizeMultiplier={largeTextCap}
              style={compact && styles.compactText}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    borderRadius: radius.control,
    padding: 4,
  },
  pill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: radius.control,
  },
  item: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  compactItem: { minHeight: 32, paddingHorizontal: 4 },
  compactText: { fontSize: 13 },
});
