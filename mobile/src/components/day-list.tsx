import type { DaySection } from "@contract";
import { Fragment, type ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Screen } from "./screen";
import { SectionHeading } from "./section-heading";
import { headerCoversScreen } from "./sticky-geometry";
import { StickyHeading } from "./sticky-heading";
import { headingLine, summaryLine } from "./summary-line";
import { Text } from "./text";

export function DayList<Row extends { key: string }>({
  notice,
  summary,
  actions,
  before,
  sections,
  renderRow,
  largeTitle,
  dimmed,
  refreshing,
  onRefresh,
}: {
  notice?: ReactNode;
  summary?: string[];
  actions?: ReactNode;
  before?: ReactNode;
  sections: DaySection<Row>[];
  renderRow: (row: Row) => ReactNode;
  largeTitle: boolean;
  dimmed?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const lead = [
    ...(notice ? [<Fragment key="notice">{notice}</Fragment>] : []),
    ...(summary
      ? [
          <Text key="summary" variant="label" style={styles.summary}>
            {summaryLine(summary)}
          </Text>,
        ]
      : []),
    ...(actions
      ? [
          <View key="actions" style={styles.rows}>
            {actions}
          </View>,
        ]
      : []),
    ...(before ? [<Fragment key="before">{before}</Fragment>] : []),
  ];
  const children = [
    ...lead,
    ...sections.flatMap((section) => {
      const title = headingLine(section);
      return [
        <SectionHeading
          key={`heading-${section.title}`}
          title={title}
          label={section.label ?? title}
        />,
        <View key={`rows-${section.title}`} style={styles.rows}>
          {section.rows.map((row) => (
            <View key={row.key}>{renderRow(row)}</View>
          ))}
        </View>,
      ];
    }),
  ];
  return (
    <Screen
      refreshing={refreshing}
      onRefresh={onRefresh}
      dimmed={dimmed}
      stickyHeaderIndices={sections.map((_, index) => lead.length + index * 2)}
      StickyHeaderComponent={
        headerCoversScreen(Platform.OS, Platform.Version, largeTitle)
          ? StickyHeading
          : undefined
      }
    >
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { fontVariant: ["tabular-nums"] },
  rows: { gap: 2 },
});
