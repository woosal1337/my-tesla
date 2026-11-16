import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useDrive } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { Chart } from "@/components/chart";
import { ExportButton } from "@/components/export-button";
import { RouteMap } from "@/components/map";
import { Notice } from "@/components/notice";
import { Panel } from "@/components/panel";
import { QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { StatGrid } from "@/components/stat";
import { Text } from "@/components/text";
import { useRefresh } from "@/hooks/use-refresh";
import { space } from "@/theme/tokens";

export function DriveScreen({ driveId }: { driveId: string }) {
  const { car } = useCar();
  const drive = useDrive(car.id, driveId);
  const refresh = useRefresh(drive);
  return (
    <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <Stack.Screen options={{ title: drive.data?.title ?? "Drive" }} />
      <QueryView query={drive}>
        {(detail) => (
          <>
            {detail.route ? (
              <View style={styles.hero}>
                <RouteMap
                  routes={[detail.route]}
                  label={`Map of the drive ${detail.title}`}
                />
              </View>
            ) : null}
            <Text variant="label">{detail.subtitle}</Text>
            {detail.notice ? <Notice text={detail.notice} /> : null}
            <ExportButton
              item={{
                label: "GPX",
                path: detail.gpxPath,
                file: `drive-${driveId.replace(/\D/g, "")}.gpx`,
              }}
            />
            <View style={styles.stats}>
              <StatGrid stats={detail.stats} />
            </View>
            {detail.charts.map((chart) => (
              <Panel key={chart.title} title={chart.title}>
                <Chart chart={chart} />
              </Panel>
            ))}
          </>
        )}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: -space.lg },
  stats: { marginVertical: space.lg },
});
