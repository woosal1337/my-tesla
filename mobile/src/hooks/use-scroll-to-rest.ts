import { useScrollToTop } from "expo-router";
import { useRef } from "react";
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native";

export function useScrollToRest() {
  const ref = useRef<ScrollViewInstance>(null);
  const restY = useRef<number | null>(null);
  const target = useRef({
    scrollToTop: () => {
      if (restY.current === null || Platform.OS !== "ios") return;
      ref.current?.scrollTo({ y: restY.current, animated: true });
    },
  });
  useScrollToTop(target);
  const onScrollBeginDrag = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = event.nativeEvent.contentOffset.y;
    if (restY.current === null && y < 0) restY.current = y;
  };
  return { ref, onScrollBeginDrag };
}
