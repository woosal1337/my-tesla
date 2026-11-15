import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Screen } from "./screen";
import { SectionHeading } from "./section-heading";
import { summaryLine } from "./summary-line";
import { Text } from "./text";

export function DayList<Row extends { key: string }>({
  summary,
  actions,
  sections,
  renderRow,
  refreshing,
  onRefresh,
}: {
  summary: string[];
  actions?: ReactNode;
  sections: { title: string; rows: Row[] }[];
  renderRow: (row: Row) => ReactNode;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const lead = [
    <Text key="summary" variant="label" style={styles.summary}>
      {summaryLine(summary)}
    </Text>,
    ...(actions
      ? [
          <View key="actions" style={styles.rows}>
            {actions}
          </View>,
        ]
      : []),
  ];
  const children = [
    ...lead,
    ...sections.flatMap((section) => [
      <SectionHeading key={`heading-${section.title}`} title={section.title} />,
      <View key={`rows-${section.title}`} style={styles.rows}>
        {section.rows.map((row) => (
          <View key={row.key}>{renderRow(row)}</View>
        ))}
      </View>,
    ]),
  ];
  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      stickyHeaderIndices={sections.map((_, index) => lead.length + index * 2)}
    >
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { fontVariant: ["tabular-nums"] },
  rows: { gap: 2 },
});
