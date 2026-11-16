import type { AppBlock } from "@contract";
import { StyleSheet, View } from "react-native";
import { largeTextCap } from "@/theme/text-size";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Text } from "./text";

type HeatmapBlock = Extract<AppBlock, { kind: "heatmap" }>;

const keyShares = [0, 0.25, 0.5, 0.75, 1];

function shade(share: number): number {
  return 0.2 + share * 0.8;
}

export function Heatmap({ block }: { block: HeatmapBlock }) {
  const palette = usePalette();
  return (
    <View>
      {block.rows.map((row) => {
        const total = row.values.reduce((sum, value) => sum + value, 0);
        return (
          <View
            key={row.label}
            accessible
            accessibilityLabel={`${row.label}: ${total} ${block.unit}`}
            style={styles.row}
          >
            <Text
              variant="caption"
              maxFontSizeMultiplier={largeTextCap}
              style={styles.label}
            >
              {row.label}
            </Text>
            <View style={styles.cells}>
              {row.values.map((value, hour) => (
                <View
                  key={hour}
                  style={[styles.cell, { backgroundColor: palette.muted }]}
                >
                  {value > 0 ? (
                    <View
                      style={[
                        styles.fill,
                        {
                          backgroundColor: palette.primary,
                          opacity: shade(value / block.max),
                        },
                      ]}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        );
      })}
      <View style={styles.hours}>
        {block.hours.map((hour, index) => (
          <Text
            key={`${hour}-${index}`}
            variant="caption"
            maxFontSizeMultiplier={largeTextCap}
            style={styles.hour}
          >
            {hour}
          </Text>
        ))}
      </View>
      <View
        accessible
        accessibilityLabel={`Darker cells mean more ${block.unit}. The most in one hour: ${block.max}.`}
        style={styles.key}
      >
        <Text
          variant="caption"
          maxFontSizeMultiplier={largeTextCap}
          style={styles.hour}
        >
          0
        </Text>
        {keyShares.map((share) => (
          <View
            key={share}
            style={[styles.keyCell, { backgroundColor: palette.muted }]}
          >
            {share > 0 ? (
              <View
                style={[
                  styles.fill,
                  { backgroundColor: palette.primary, opacity: shade(share) },
                ]}
              />
            ) : null}
          </View>
        ))}
        <Text
          variant="caption"
          maxFontSizeMultiplier={largeTextCap}
          style={styles.hour}
        >
          {block.max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  label: { width: 36 },
  cells: { flex: 1, flexDirection: "row", gap: 2 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 2, overflow: "hidden" },
  fill: { flex: 1 },
  hours: {
    marginTop: space.xs,
    marginLeft: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hour: { fontSize: 11, fontVariant: ["tabular-nums"] },
  key: {
    marginTop: space.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
  },
  keyCell: { width: 10, height: 10, borderRadius: 2, overflow: "hidden" },
});
