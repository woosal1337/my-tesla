import { useRouter } from "expo-router";
import { useCharges } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { ChargeListRow } from "@/components/charge-row";
import { DayList } from "@/components/day-list";
import { icons } from "@/components/icons";
import { LinkRow } from "@/components/link-row";
import { EmptyState, QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { useRefresh } from "@/hooks/use-refresh";

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
        <QueryView query={charges}>
          {() => (
            <EmptyState
              title="No charges yet"
              text="A charge shows here after the car charges. TeslaMate records only from the moment you sign in."
            />
          )}
        </QueryView>
      </Screen>
    );
  }
  return (
    <DayList
      notice={<QueryView query={charges}>{() => null}</QueryView>}
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
      renderRow={(row) => <ChargeListRow row={row} stack="charging" />}
      largeTitle
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
    />
  );
}
