import { useAnimatedHeaderHeight } from "expo-router/native-stack";
import { useEffect, useImperativeHandle, useState } from "react";
import { Animated, type ScrollViewProps, StyleSheet } from "react-native";
import { type HeadingBox, stickyRange } from "./sticky-geometry";

type StickyHeaderProps = Parameters<
  NonNullable<ScrollViewProps["StickyHeaderComponent"]>
>[0];

export function StickyHeading({
  ref,
  children,
  nextHeaderLayoutY,
  onLayout,
  scrollAnimatedValue,
}: StickyHeaderProps) {
  const headerHeight = useAnimatedHeaderHeight();
  const [box, setBox] = useState<HeadingBox | null>(null);
  const [nextY, setNextY] = useState(nextHeaderLayoutY);
  const [scrolled, setScrolled] = useState(false);
  useImperativeHandle(ref, () => ({ setNextHeaderY: setNextY }), []);
  useEffect(() => {
    if (scrolled) {
      return;
    }
    const id = scrollAnimatedValue.addListener(() => setScrolled(true));
    return () => scrollAnimatedValue.removeListener(id);
  }, [scrolled, scrollAnimatedValue]);
  const translateY = Animated.add(
    scrollAnimatedValue,
    headerHeight,
  ).interpolate(stickyRange(scrolled ? box : null, nextY));
  return (
    <Animated.View
      collapsable={false}
      onLayout={(event) => {
        const { y, height } = event.nativeEvent.layout;
        setBox({ y, height });
        onLayout(event);
      }}
      style={[styles.above, { transform: [{ translateY }] }]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  above: { zIndex: 10 },
});
