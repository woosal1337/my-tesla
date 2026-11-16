import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useReport } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { DayList } from "@/components/day-list";
import { DriveListRow } from "@/components/drive-row";
import { ExportButton } from "@/components/export-button";
import { MapSection, RouteMap } from "@/components/map";
import { QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { SegmentedControl } from "@/components/segmented-control";
import { StatGrid } from "@/components/stat";
import { Text } from "@/components/text";
import { useRefresh } from "@/hooks/use-refresh";
import { space } from "@/theme/tokens";

const shortLabels: Record<string, string> = {
  "Last 7 days": "7 days",
  "Last 30 days": "30 days",
  "This month": "Month",
  "This year": "Year",
};

export default function ReportScreen() {
  const { car } = useCar();
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const report = useReport(car.id, range);
  const refresh = useRefresh(report);
  const page = report.data;
  const chosen =
    page?.presets.find(
      (preset) => preset.from === page.from && preset.to === page.to,
    ) ?? null;
  return (
    <>
      <Stack.Screen options={{ title: "Report" }} />
      {page ? (
        <DayList
          before={
            <QueryView query={report}>
              {() => (
                <View style={styles.group}>
                  {page.subtitle ? (
                    <Text variant="label">{page.subtitle}</Text>
                  ) : null}
                  <SegmentedControl
                    label="Range"
                    size="compact"
                    items={page.presets.map((preset) => ({
                      id: `${preset.from}/${preset.to}`,
                      label: shortLabels[preset.label] ?? preset.label,
                    }))}
                    value={chosen ? `${chosen.from}/${chosen.to}` : ""}
                    onChange={(id) => {
                      const [from = "", to = ""] = id.split("/");
                      setRange({ from, to });
                    }}
                  />
                  {page.notice ? (
                    <Text variant="label" tone="subtle">
                      {page.notice}
                    </Text>
                  ) : null}
                  <StatGrid stats={page.stats} />
                  {page.exports.length ? (
                    <View style={styles.exports}>
                      {page.exports.map((item) => (
                        <View key={item.path} style={styles.export}>
                          <ExportButton
                            item={item}
                            disabled={report.isPlaceholderData}
                          />
                        </View>
                      ))}
                    </View>
                  ) : null}
                  {page.routes && page.routes.length ? (
                    <MapSection title="Routes">
                      <RouteMap
                        routes={page.routes}
                        markers={page.markers}
                        label="The routes of the range"
                      />
                    </MapSection>
                  ) : null}
                </View>
              )}
            </QueryView>
          }
          sections={page.sections}
          renderRow={(row) => <DriveListRow row={row} stack="drives" />}
          largeTitle={false}
          dimmed={report.isPlaceholderData}
          refreshing={refresh.refreshing}
          onRefresh={refresh.onRefresh}
        />
      ) : (
        <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
          <QueryView query={report}>{() => null}</QueryView>
        </Screen>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.lg },
  exports: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  export: { flexGrow: 1, flexShrink: 1, gap: space.sm },
});
