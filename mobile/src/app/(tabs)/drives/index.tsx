import { useRouter } from "expo-router";
import { useDrives } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { DayList } from "@/components/day-list";
import { DriveListRow } from "@/components/drive-row";
import { icons } from "@/components/icons";
import { LinkRow } from "@/components/link-row";
import { EmptyState, QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { useRefresh } from "@/hooks/use-refresh";

function DrivesLinks() {
  const router = useRouter();
  return (
    <>
      <LinkRow
        icon={icons.timeline}
        title="Timeline"
        subtitle="One day at a time"
        onPress={() => router.push("/drives/timeline")}
      />
      <LinkRow
        icon={icons.report}
        title="Report"
        subtitle="Totals and exports for a date range"
        onPress={() => router.push("/drives/report")}
      />
    </>
  );
}

export default function DrivesScreen() {
  const { car } = useCar();
  const drives = useDrives(car.id);
  const refresh = useRefresh(drives);
  if (!drives.data) {
    return (
      <Screen>
        <QueryView query={drives}>{() => null}</QueryView>
      </Screen>
    );
  }
  if (drives.data.sections.length === 0) {
    return (
      <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
        <EmptyState
          title="No drives yet"
          text="A drive shows here after the car drives. TeslaMate records only from the moment you sign in."
        />
      </Screen>
    );
  }
  return (
    <DayList
      summary={[car.name, ...drives.data.summary]}
      actions={<DrivesLinks />}
      sections={drives.data.sections}
      renderRow={(row) => <DriveListRow row={row} stack="drives" />}
      largeTitle
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
    />
  );
}
