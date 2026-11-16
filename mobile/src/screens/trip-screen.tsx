import type { TripStepRow } from "@contract";
import { Stack, useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTrip } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { Icon } from "@/components/icon";
import { icons } from "@/components/icons";
import { ListRow } from "@/components/list-row";
import { RouteMap } from "@/components/map";
import { QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { StatGrid } from "@/components/stat";
import { dottedLine } from "@/components/summary-line";
import { Text } from "@/components/text";
import { useRefresh } from "@/hooks/use-refresh";
import { targetHref } from "@/navigation/targets";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

function StepIcon({ kind }: { kind: TripStepRow["kind"] }) {
  const palette = usePalette();
  const style = {
    drive: {
      icon: icons.drive,
      color: palette.primaryForeground,
      fill: palette.primary,
    },
    charge: {
      icon: icons.charge,
      color: palette.primaryForeground,
      fill: palette.charge,
    },
    stop: {
      icon: icons.stop,
      color: palette.mutedForeground,
      fill: palette.muted,
    },
  }[kind];
  return (
    <View style={[styles.icon, { backgroundColor: style.fill }]}>
      <Icon name={style.icon} color={style.color} size={16} />
    </View>
  );
}

export function TripScreen({ tripId }: { tripId: string }) {
  const router = useRouter();
  const { car } = useCar();
  const trip = useTrip(car.id, tripId);
  const refresh = useRefresh(trip);
  return (
    <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <Stack.Screen options={{ title: trip.data?.title ?? "Trip" }} />
      <QueryView query={trip}>
        {(detail) => (
          <>
            {detail.routes?.length ? (
              <View style={styles.hero}>
                <RouteMap
                  routes={detail.routes}
                  markers={detail.markers ?? []}
                  label={`Map of the trip to ${detail.title}`}
                  width={3}
                />
              </View>
            ) : null}
            <Text variant="label">{dottedLine(detail.subtitle)}</Text>
            <View style={styles.stats}>
              <StatGrid stats={detail.stats} />
            </View>
            <View style={styles.steps}>
              {detail.steps.map((step) => {
                const target = step.target;
                return (
                  <ListRow
                    key={step.key}
                    label={`${step.clock}, ${step.title}, ${step.detail}`}
                    onPress={
                      target
                        ? () => router.push(targetHref(target, "drives"))
                        : undefined
                    }
                    start={<StepIcon kind={step.kind} />}
                    startWidth={32}
                    title={step.title}
                    subtitle={`${step.clock} · ${step.detail}`}
                  />
                );
              })}
            </View>
          </>
        )}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { marginTop: -space.lg },
  stats: { marginVertical: space.lg },
  steps: { gap: 2 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
