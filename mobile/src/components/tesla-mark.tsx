import { useEffect, useState } from "react";
import { Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import { markOutlineLength, teslaMarkPath } from "@/theme/mark";
import { motion } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { useReducedMotion } from "@/theme/use-reduced-motion";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const drawMs = 1100;
const breatheMs = 700;

type MarkKind = "draw" | "breathe" | "still";

function useMarkMotion(kind: MarkKind): Animated.Value {
  const reduced = useReducedMotion();
  const [progress] = useState(
    () => new Animated.Value(kind === "still" ? 1 : 0),
  );

  useEffect(() => {
    if (kind === "still") return;
    if (reduced) {
      progress.setValue(1);
      return;
    }
    const animation =
      kind === "draw"
        ? Animated.timing(progress, {
            toValue: 1,
            duration: drawMs,
            easing: motion.easing,
            useNativeDriver: false,
          })
        : Animated.sequence([
            Animated.timing(progress, {
              toValue: 1,
              duration: breatheMs,
              easing: motion.easing,
              useNativeDriver: true,
            }),
            Animated.loop(
              Animated.sequence([
                Animated.timing(progress, {
                  toValue: 0.35,
                  duration: breatheMs,
                  easing: motion.easing,
                  useNativeDriver: true,
                }),
                Animated.timing(progress, {
                  toValue: 1,
                  duration: breatheMs,
                  easing: motion.easing,
                  useNativeDriver: true,
                }),
              ]),
            ),
          ]);
    animation.start();
    return () => animation.stop();
  }, [kind, progress, reduced]);

  return progress;
}

export function TeslaMark({ size, kind }: { size: number; kind: MarkKind }) {
  const palette = usePalette();
  const progress = useMarkMotion(kind);
  const drawing = kind === "draw";
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={drawing ? undefined : { opacity: progress }}
    >
      <Svg width={size} height={size} viewBox="-0.5 -0.5 25 25">
        <AnimatedPath
          d={teslaMarkPath}
          fill={palette.foreground}
          stroke={palette.foreground}
          strokeWidth={0.35}
          strokeLinejoin="round"
          strokeDasharray={drawing ? [markOutlineLength] : undefined}
          strokeDashoffset={
            drawing
              ? progress.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [markOutlineLength, 0, 0],
                })
              : undefined
          }
          fillOpacity={
            drawing
              ? progress.interpolate({
                  inputRange: [0, 0.6, 1],
                  outputRange: [0, 0, 1],
                })
              : 1
          }
        />
      </Svg>
    </Animated.View>
  );
}
