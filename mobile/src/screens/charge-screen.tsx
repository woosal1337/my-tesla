import { Stack, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useLiveChanges } from "@/api/live";
import { useCharge } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { Button } from "@/components/button";
import { Chart } from "@/components/chart";
import { ChargerBadge } from "@/components/charger-badge";
import { LocationMap, MapSection } from "@/components/map";
import { Notice } from "@/components/notice";
import { Panel } from "@/components/panel";
import { QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { StatGrid } from "@/components/stat";
import { LevelBar } from "@/components/strips";
import { Text } from "@/components/text";
import { chargeLeftText } from "@/format";
import { useNow } from "@/hooks/use-now";
import { useRefresh } from "@/hooks/use-refresh";
import { space } from "@/theme/tokens";

const countdownMs = 15_000;

export function ChargeScreen({ chargeId }: { chargeId: string }) {
  const router = useRouter();
  const { car } = useCar();
  const charge = useCharge(car.id, chargeId);
  useLiveChanges(car.id, ["charge", car.id, chargeId]);
  const refresh = useRefresh(charge);
  const now = useNow(countdownMs);
  const step = (id: number) => router.setParams({ chargeId: String(id) });
  return (
    <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <Stack.Screen options={{ title: charge.data?.title ?? "Charge" }} />
      <QueryView query={charge}>
        {(detail) => {
          const left = chargeLeftText(detail.fullAt, now);
          const previous = detail.previousId;
          const next = detail.nextId;
          return (
            <>
              <View style={styles.kind}>
                <ChargerBadge fast={detail.fast} />
                <Text variant="label">{detail.kind}</Text>
              </View>
              <Text variant="label">{detail.subtitle}</Text>
              {left ? (
                <Text variant="heading" tone="charge">
                  {left}
                </Text>
              ) : null}
              {detail.notice ? <Notice text={detail.notice} /> : null}
              <View style={styles.hero}>
                <StatGrid stats={detail.hero} size="title" />
              </View>
              {detail.levels ? (
                <View
                  accessible
                  accessibilityLabel={`Battery from ${detail.levels.start}% to ${detail.levels.end}%`}
                >
                  <LevelBar levels={detail.levels} wide />
                  <View style={styles.levels}>
                    <Text variant="caption">0%</Text>
                    <Text variant="caption" style={styles.tabular}>
                      {detail.levels.start}% → {detail.levels.end}%
                    </Text>
                    <Text variant="caption">100%</Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.stats}>
                <StatGrid stats={detail.stats} />
              </View>
              {detail.cost ? (
                <Panel title="Cost breakdown">
                  <StatGrid stats={detail.cost.stats} />
                  {detail.cost.note ? (
                    <Text variant="caption">{detail.cost.note}</Text>
                  ) : null}
                </Panel>
              ) : null}
              {detail.charts.map((chart) => (
                <Panel key={chart.title} title={chart.title}>
                  <Chart chart={chart} />
                </Panel>
              ))}
              {detail.location ? (
                <MapSection title="Location">
                  <LocationMap
                    latitude={detail.location.latitude}
                    longitude={detail.location.longitude}
                    label={`Map of the charge at ${detail.title}`}
                  />
                </MapSection>
              ) : null}
              <View style={styles.steps}>
                <View style={styles.step}>
                  <Button
                    label="Older"
                    kind="secondary"
                    disabled={previous === null}
                    onPress={() => previous !== null && step(previous)}
                  />
                </View>
                <View style={styles.step}>
                  <Button
                    label="Newer"
                    kind="secondary"
                    disabled={next === null}
                    onPress={() => next !== null && step(next)}
                  />
                </View>
              </View>
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kind: { flexDirection: "row", alignItems: "center", gap: space.sm },
  hero: { marginTop: space.lg },
  levels: {
    marginTop: space.sm,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabular: { fontVariant: ["tabular-nums"] },
  stats: { marginVertical: space.lg },
  steps: { flexDirection: "row", gap: space.md },
  step: { flex: 1 },
});
