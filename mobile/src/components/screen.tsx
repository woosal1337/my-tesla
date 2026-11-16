import type { ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollToRest } from "@/hooks/use-scroll-to-rest";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { headerCoversScreen } from "./sticky-geometry";

export const screenPadding = space.xl;

export function Screen({
  children,
  refreshing,
  onRefresh,
  stickyHeaderIndices,
  StickyHeaderComponent,
  dimmed = false,
  withoutHeader = false,
  coverStatusBar = false,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  stickyHeaderIndices?: number[];
  StickyHeaderComponent?: ScrollViewProps["StickyHeaderComponent"];
  dimmed?: boolean;
  withoutHeader?: boolean;
  coverStatusBar?: boolean;
}) {
  const palette = usePalette();
  const { top } = useSafeAreaInsets();
  const { ref, onScrollBeginDrag } = useScrollToRest();
  const statusBar = withoutHeader && Platform.OS === "android" ? top : 0;
  const strip =
    withoutHeader ||
    (coverStatusBar &&
      headerCoversScreen(Platform.OS, Platform.Version, false));
  return (
    <>
      <ScrollView
        ref={ref}
        onScrollBeginDrag={onScrollBeginDrag}
        scrollToOverflowEnabled
        style={{ backgroundColor: palette.background }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: space.lg + statusBar },
          dimmed && styles.dimmed,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        stickyHeaderIndices={stickyHeaderIndices}
        StickyHeaderComponent={StickyHeaderComponent}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              tintColor={palette.subtle}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
      {strip ? <StatusBarStrip /> : null}
    </>
  );
}

export function StatusBarStrip() {
  const palette = usePalette();
  const { top } = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={[
        styles.statusBar,
        { height: top, backgroundColor: palette.background },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingBottom: space.xxl * 3,
    gap: space.lg,
  },
  dimmed: { opacity: 0.6 },
  statusBar: { position: "absolute", top: 0, left: 0, right: 0 },
});
