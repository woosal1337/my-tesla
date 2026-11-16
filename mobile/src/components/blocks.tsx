import type { AppBlock } from "@contract";
import { StyleSheet, View } from "react-native";
import { space } from "@/theme/tokens";
import { toneColor } from "@/theme/tones";
import { usePalette } from "@/theme/use-palette";
import { useLargeText } from "@/theme/use-text-size";
import type { TabStack } from "@/navigation/targets";
import { Chart } from "./chart";
import { Heatmap } from "./heatmap";
import { PlacesMap, RouteMap } from "./map";
import { Notice } from "./notice";
import { Records } from "./records";
import { StatGrid } from "./stat";
import { dottedLine } from "./summary-line";
import { Text } from "./text";

function Shares({
  rows,
}: {
  rows: Extract<AppBlock, { kind: "shares" }>["rows"];
}) {
  const palette = usePalette();
  return (
    <View style={styles.shares}>
      {rows.map((row) => (
        <View
          key={row.label}
          accessible
          accessibilityLabel={`${row.label}, ${row.text}`}
        >
          <View style={styles.shareText}>
            <Text variant="label" tone="foreground">
              {row.label}
            </Text>
            <Text variant="label" style={styles.tabular}>
              {dottedLine(row.text)}
            </Text>
          </View>
          <View style={[styles.shareTrack, { backgroundColor: palette.muted }]}>
            <View
              style={[
                styles.shareFill,
                {
                  width: `${row.share * 100}%`,
                  backgroundColor:
                    row.color === "charge" ? palette.charge : palette.primary,
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

type TableBlock = Extract<AppBlock, { kind: "table" }>;

function tableRowLabel(block: TableBlock, row: TableBlock["rows"][number]) {
  return row.cells
    .map((cell, index) => `${block.columns[index]}: ${cell.text}`)
    .join(", ");
}

function StackedTable({ block }: { block: TableBlock }) {
  const palette = usePalette();
  return (
    <View>
      {block.rows.map((row, rowIndex) => (
        <View
          key={row.key}
          accessible
          accessibilityLabel={tableRowLabel(block, row)}
          style={[
            styles.stackedTableRow,
            rowIndex > 0 && styles.tableBody,
            { borderTopColor: palette.border },
          ]}
        >
          {row.cells.map((cell, index) =>
            index === 0 ? (
              <Text key={index} variant="label" tone="foreground">
                {cell.text}
              </Text>
            ) : (
              <View key={index} style={styles.stackedCell}>
                <Text variant="caption">{block.columns[index]}</Text>
                <Text
                  variant="label"
                  color={toneColor(palette, cell.tone)}
                  style={styles.tabular}
                >
                  {cell.text}
                </Text>
              </View>
            ),
          )}
        </View>
      ))}
    </View>
  );
}

function Table({ block }: { block: TableBlock }) {
  const palette = usePalette();
  const large = useLargeText();
  if (large) return <StackedTable block={block} />;
  return (
    <View>
      <View style={styles.tableRow}>
        {block.columns.map((column, index) => (
          <Text
            key={column}
            variant="caption"
            style={[styles.cell, index > 0 && styles.numberCell]}
          >
            {column}
          </Text>
        ))}
      </View>
      {block.rows.map((row) => (
        <View
          key={row.key}
          accessible
          accessibilityLabel={tableRowLabel(block, row)}
          style={[
            styles.tableRow,
            styles.tableBody,
            { borderTopColor: palette.border },
          ]}
        >
          {row.cells.map((cell, index) => (
            <Text
              key={index}
              variant="label"
              color={
                index === 0 ? palette.foreground : toneColor(palette, cell.tone)
              }
              style={[styles.cell, index > 0 && styles.numberCell]}
            >
              {cell.text}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function Progress({
  block,
}: {
  block: Extract<AppBlock, { kind: "progress" }>;
}) {
  const palette = usePalette();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={block.end}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(block.share * 100),
      }}
    >
      <View style={[styles.progressTrack, { backgroundColor: palette.muted }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${block.share * 100}%`,
              backgroundColor: palette.primary,
            },
          ]}
        />
      </View>
      <View style={styles.progressText}>
        <Text variant="caption">{block.start}</Text>
        <Text variant="caption" style={styles.tabular}>
          {block.end}
        </Text>
      </View>
    </View>
  );
}

function Note({ block }: { block: Extract<AppBlock, { kind: "note" }> }) {
  switch (block.role) {
    case "heading":
      return (
        <Text
          variant="strong"
          accessibilityRole="header"
          style={styles.noteHeading}
        >
          {block.text}
        </Text>
      );
    case "body":
      return <Text variant="body">{block.text}</Text>;
    case "caption":
      return <Text variant="label">{block.text}</Text>;
    default:
      return (
        <Text variant="label" tone="subtle" style={styles.emptyNote}>
          {block.text}
        </Text>
      );
  }
}

export function Block({ block, stack }: { block: AppBlock; stack: TabStack }) {
  switch (block.kind) {
    case "stats":
      return <StatGrid stats={block.stats} />;
    case "chart":
      return <Chart chart={block.chart} />;
    case "shares":
      return <Shares rows={block.rows} />;
    case "table":
      return <Table block={block} />;
    case "progress":
      return <Progress block={block} />;
    case "records":
      return <Records rows={block.rows} stack={stack} />;
    case "heatmap":
      return <Heatmap block={block} />;
    case "notice":
      return <Notice text={block.text} />;
    case "map":
      return <PlacesMap places={block.places} />;
    case "routes":
      return (
        <RouteMap
          routes={block.routes}
          markers={[]}
          width={2}
          label="Every road driven"
        />
      );
    case "note":
      return <Note block={block} />;
  }
}

const styles = StyleSheet.create({
  shares: { gap: space.lg },
  shareText: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: space.lg,
    rowGap: 2,
  },
  shareTrack: {
    marginTop: space.sm,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  shareFill: { height: "100%", borderRadius: 3 },
  tableRow: { flexDirection: "row", gap: space.md, paddingVertical: space.sm },
  tableBody: { borderTopWidth: StyleSheet.hairlineWidth },
  stackedTableRow: { gap: 2, paddingVertical: space.sm },
  stackedCell: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    columnGap: space.md,
  },
  cell: { flex: 1.4 },
  numberCell: { flex: 1, textAlign: "right", fontVariant: ["tabular-nums"] },
  progressTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: {
    marginTop: space.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: space.md,
  },
  tabular: { fontVariant: ["tabular-nums"] },
  emptyNote: { paddingVertical: space.xl, textAlign: "center" },
  noteHeading: { marginTop: space.sm, marginBottom: -space.sm },
});
