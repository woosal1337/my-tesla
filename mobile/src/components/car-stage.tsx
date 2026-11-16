import type { CarImageFrame, OverviewCallout } from "@contract";
import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { motion, space } from "@/theme/tokens";
import { liveToneColor } from "@/theme/tones";
import { usePalette } from "@/theme/use-palette";
import { useReducedMotion } from "@/theme/use-reduced-motion";
import { carSlot } from "./car-frame";
import { screenPadding } from "./screen";
import { TeslaMark } from "./tesla-mark";
import { Text } from "./text";

type RenderState = "loading" | "ready" | "failed";

const stageMaxWidth = 440;

const glowOpacity = { light: 0.06, dark: 0.09 };

const textAlign = { left: "left", top: "center", right: "right" } as const;

function Callout({ callout }: { callout: OverviewCallout }) {
  const palette = usePalette();
  const align = { textAlign: textAlign[callout.side] };
  return (
    <View
      accessible
      accessibilityLabel={`${callout.label}, ${callout.value}`}
      style={[styles.callout, styles[callout.side]]}
    >
      <Text
        variant="caption"
        tone="mutedForeground"
        style={[styles.calloutLabel, align]}
      >
        {callout.label}
      </Text>
      <Text
        variant="strong"
        color={
          callout.tone === "normal"
            ? palette.foreground
            : liveToneColor(palette, callout.tone)
        }
        style={align}
      >
        {callout.value}
      </Text>
    </View>
  );
}

function Callouts({ callouts }: { callouts: OverviewCallout[] }) {
  const top = callouts.filter((callout) => callout.side === "top");
  const sides = [
    ...callouts.filter((callout) => callout.side === "left"),
    ...callouts.filter((callout) => callout.side === "right"),
  ];
  return (
    <View style={styles.callouts}>
      {top.map((callout) => (
        <Callout key={callout.key} callout={callout} />
      ))}
      {sides.length > 0 ? (
        <View style={styles.calloutRow}>
          {sides.map((callout) => (
            <Callout key={callout.key} callout={callout} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Glow() {
  const palette = usePalette();
  const opacity = glowOpacity[useColorScheme() === "dark" ? "dark" : "light"];
  return (
    <View style={styles.glow}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop
              offset="0"
              stopColor={palette.foreground}
              stopOpacity={opacity}
            />
            <Stop offset="1" stopColor={palette.foreground} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>
    </View>
  );
}

export function CarStage({
  image,
  imageFrame,
  name,
  callouts,
}: {
  image: string | null;
  imageFrame: CarImageFrame | null;
  name: string;
  callouts: OverviewCallout[];
}) {
  const reduced = useReducedMotion();
  const [state, setState] = useState<RenderState>("loading");
  const shown = image && state !== "failed" ? image : null;
  if (!shown && callouts.length === 0) return null;
  const slot = carSlot(imageFrame);
  return (
    <View style={styles.stage}>
      <View style={styles.content}>
        {callouts.length > 0 ? <Callouts callouts={callouts} /> : null}
        {shown ? (
          <View style={[styles.car, { aspectRatio: slot.aspectRatio }]}>
            <Glow />
            {state === "loading" ? (
              <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
                <TeslaMark size={40} kind="breathe" />
              </View>
            ) : null}
            <Image
              source={shown}
              accessibilityLabel={name}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={
                reduced
                  ? null
                  : { duration: motion.durationMs, skipOnCacheHit: "all" }
              }
              onLoad={() => setState("ready")}
              onError={() => setState("failed")}
              style={[styles.image, slot.image]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flexGrow: 1,
    justifyContent: "center",
    marginHorizontal: -screenPadding,
    paddingHorizontal: screenPadding,
    paddingVertical: space.sm,
    overflow: "hidden",
  },
  content: {
    width: "100%",
    maxWidth: stageMaxWidth,
    alignSelf: "center",
    gap: space.lg,
  },
  callouts: { gap: space.md },
  calloutRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: space.lg,
    rowGap: space.md,
  },
  callout: { gap: 2 },
  calloutLabel: { textTransform: "uppercase", letterSpacing: 1 },
  left: { flexGrow: 1, alignItems: "flex-start" },
  top: { alignItems: "center" },
  right: { flexGrow: 1, alignItems: "flex-end" },
  car: { width: "100%", marginBottom: space.xl },
  glow: {
    position: "absolute",
    left: "-4%",
    right: "-4%",
    bottom: "-16%",
    height: "56%",
  },
  placeholder: { alignItems: "center", justifyContent: "center" },
  image: { position: "absolute" },
});
