import type { ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

export const screenPadding = space.xl;

export function Screen({
  children,
  refreshing,
  onRefresh,
  stickyHeaderIndices,
  StickyHeaderComponent,
  dimmed = false,
  withoutHeader = false,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  stickyHeaderIndices?: number[];
  StickyHeaderComponent?: ScrollViewProps["StickyHeaderComponent"];
  dimmed?: boolean;
  withoutHeader?: boolean;
}) {
  const palette = usePalette();
  const { top } = useSafeAreaInsets();
  const statusBar = withoutHeader && Platform.OS === "android" ? top : 0;
  return (
    <ScrollView
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
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: screenPadding,
    paddingBottom: space.xxl * 3,
    gap: space.lg,
  },
  dimmed: { opacity: 0.6 },
});
