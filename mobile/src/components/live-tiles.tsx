import type { OverviewPage } from "@contract";
import { StyleSheet, View } from "react-native";
import { chargeLeftText } from "@/format";
import { useNow } from "@/hooks/use-now";
import { space } from "@/theme/tokens";
import { liveToneColor } from "@/theme/tones";
import { usePalette } from "@/theme/use-palette";
import { useLargeText } from "@/theme/use-text-size";
import { Icon } from "./icon";
import { liveIcons } from "./icons";
import { Notice } from "./notice";
import { Panel } from "./panel";
import { Text } from "./text";

const countdownMs = 15_000;

export function LivePanel({
  live,
}: {
  live: NonNullable<OverviewPage["live"]>;
}) {
  const palette = usePalette();
  const large = useLargeText();
  const now = useNow(countdownMs);
  return (
    <Panel
      title="Live"
      note={live.connected ? "Feed connected" : "Feed offline"}
    >
      {live.empty ? (
        <Text variant="label">{live.empty}</Text>
      ) : (
        <View style={styles.grid}>
          {live.tiles.map((tile) => {
            const left = chargeLeftText(tile.fullAt, now);
            return (
              <View
                key={tile.key}
                accessible
                accessibilityLabel={[tile.title, tile.detail, left]
                  .filter(Boolean)
                  .join(", ")}
                style={[styles.tile, large && styles.wide]}
              >
                <Icon
                  name={liveIcons[tile.icon]}
                  color={liveToneColor(palette, tile.tone)}
                />
                <View style={styles.tileText}>
                  <Text variant="strong">{tile.title}</Text>
                  {tile.detail ? (
                    <Text variant="caption">{tile.detail}</Text>
                  ) : null}
                  {left ? (
                    <Text variant="caption" tone="charge">
                      {left}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
      {live.notices.map((notice) => (
        <Notice key={notice} text={notice} />
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: space.lg },
  tile: {
    flexBasis: "50%",
    flexDirection: "row",
    gap: space.md,
    paddingRight: space.md,
  },
  wide: { flexBasis: "100%" },
  tileText: { flex: 1, minWidth: 0 },
});
