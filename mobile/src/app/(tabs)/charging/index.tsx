import type { ChargeRow } from "@contract";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useCharges } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { ChargerBadge } from "@/components/charger-badge";
import { DayList } from "@/components/day-list";
import { icons } from "@/components/icons";
import { LinkRow } from "@/components/link-row";
import { ListRow, RowTime } from "@/components/list-row";
import { EmptyState, QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { LevelBar } from "@/components/strips";
import { Text } from "@/components/text";
import { useRefresh } from "@/hooks/use-refresh";
import { space } from "@/theme/tokens";

function ChargeListRow({ row }: { row: ChargeRow }) {
  const router = useRouter();
  const energy = row.energy ?? "Ongoing…";
  return (
    <ListRow
      label={[
        row.clock,
        row.place,
        row.fast ? "DC" : "AC",
        row.detail,
        energy,
        row.cost,
      ]
        .filter(Boolean)
        .join(", ")}
      onPress={() =>
        router.push({
          pathname: "/charging/[chargeId]",
          params: { chargeId: String(row.id) },
        })
      }
      start={<RowTime clock={row.clock} caption={row.duration} />}
      title={
        <View style={styles.title}>
          <Text variant="strong" style={styles.place}>
            {row.place}
          </Text>
          <ChargerBadge fast={row.fast} />
        </View>
      }
      subtitle={row.detail}
      accessory={row.levels ? <LevelBar levels={row.levels} /> : null}
      end={
        <>
          <Text
            variant="strong"
            tone={row.energy ? "foreground" : "charge"}
            numberOfLines={1}
          >
            {energy}
          </Text>
          {row.cost ? (
            <Text variant="caption" numberOfLines={1}>
              {row.cost}
            </Text>
          ) : null}
        </>
      }
    />
  );
}

export default function ChargingScreen() {
  const router = useRouter();
  const { car } = useCar();
  const charges = useCharges(car.id);
  const refresh = useRefresh(charges);
  if (!charges.data) {
    return (
      <Screen>
        <QueryView query={charges}>{() => null}</QueryView>
      </Screen>
    );
  }
  if (charges.data.sections.length === 0) {
    return (
      <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
        <EmptyState
          title="No charges yet"
          text="A charge shows here after the car charges. TeslaMate records only from the moment you sign in."
        />
      </Screen>
    );
  }
  return (
    <DayList
      summary={[car.name, ...charges.data.summary]}
      actions={
        <LinkRow
          icon={icons.stats}
          title="Charging insights"
          subtitle="Curves, charging times, and places"
          onPress={() => router.push("/charging/insights")}
        />
      }
      sections={charges.data.sections}
      renderRow={(row) => <ChargeListRow row={row} />}
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: "row", alignItems: "center", gap: space.sm },
  place: { flexShrink: 1 },
});
