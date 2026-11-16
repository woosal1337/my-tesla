import { useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";
import { motion } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { useReducedMotion } from "@/theme/use-reduced-motion";
import { launchMarkSize } from "./launch-frame";
import { TeslaMark } from "./tesla-mark";

const minimumVisibleMs = 1150;

export function LaunchSplash() {
  const palette = usePalette();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () =>
        Animated.timing(opacity, {
          toValue: 0,
          duration: reduced ? 0 : motion.durationMs,
          easing: motion.easing,
          useNativeDriver: true,
        }).start(() => setGone(true)),
      minimumVisibleMs,
    );
    return () => clearTimeout(timer);
  }, [opacity, reduced]);

  if (gone) return null;
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.splash,
        { backgroundColor: palette.background, opacity },
      ]}
    >
      <TeslaMark size={launchMarkSize} kind="draw" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splash: { alignItems: "center", justifyContent: "center", zIndex: 10 },
});
