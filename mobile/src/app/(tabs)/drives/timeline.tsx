import type { TimelinePage } from "@contract";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useTimeline } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { DayStepper } from "@/components/day-stepper";
import { DayStrip } from "@/components/day-strip";
import { Icon } from "@/components/icon";
import { icons } from "@/components/icons";
import { LinkRow } from "@/components/link-row";
import { ListRow } from "@/components/list-row";
import { Panel } from "@/components/panel";
import { EmptyState, QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { StatGrid } from "@/components/stat";
import { Text } from "@/components/text";
import { useRefresh } from "@/hooks/use-refresh";
import { useSwipe } from "@/hooks/use-swipe";
import { targetHref } from "@/navigation/targets";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

const rowIcons = {
  drive: icons.drive,
  charge: icons.charge,
  parked: icons.stop,
} as const;

function TimelineRow({ row }: { row: TimelinePage["rows"][number] }) {
  const router = useRouter();
  const palette = usePalette();
  const color =
    row.kind === "drive"
      ? palette.primary
      : row.kind === "charge"
        ? palette.charge
        : palette.subtle;
  const target = row.target;
  return (
    <ListRow
      label={`${row.time}, ${row.title}, ${row.detail}`}
      onPress={
        target ? () => router.push(targetHref(target, "drives")) : undefined
      }
      start={<Icon name={rowIcons[row.kind]} color={color} />}
      startWidth={28}
      title={row.title}
      subtitle={row.detail}
      end={
        <Text variant="caption" style={styles.time}>
          {row.time}
        </Text>
      }
    />
  );
}

function TimelineDay({
  page,
  dimmed,
  onDay,
}: {
  page: TimelinePage;
  dimmed: boolean;
  onDay: (day: string | null) => void;
}) {
  const { previous, next, lastActive } = page;
  const swipe = useSwipe((step) => {
    if (step < 0) onDay(previous);
    else if (next) onDay(next);
  });
  return (
    <View {...swipe} style={[styles.content, dimmed && styles.dimmed]}>
      <DayStepper
        title={page.title}
        onPrevious={() => onDay(previous)}
        onNext={next ? () => onDay(next) : null}
        onToday={next === null ? null : () => onDay(null)}
      />
      {lastActive ? (
        <LinkRow
          icon={icons.year}
          title={lastActive.title}
          subtitle={lastActive.detail}
          onPress={() => onDay(lastActive.day)}
        />
      ) : null}
      {page.stats.length ? <StatGrid stats={page.stats} /> : null}
      <Panel title="Hour by hour">
        <DayStrip today={page.strip} label={`${page.title}, hour by hour`} />
      </Panel>
      {page.rows.length ? (
        <View style={styles.rows}>
          {page.rows.map((row) => (
            <TimelineRow key={row.key} row={row} />
          ))}
        </View>
      ) : (
        <EmptyState
          title="No record yet"
          text="TeslaMate recorded nothing on this day."
        />
      )}
    </View>
  );
}

export default function TimelineScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const asked =
    typeof params.day === "string" && dayPattern.test(params.day)
      ? params.day
      : null;
  const [day, setDay] = useState<string | null>(asked);
  const { car } = useCar();
  const timeline = useTimeline(car.id, day);
  const refresh = useRefresh(timeline);
  return (
    <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <QueryView query={timeline}>
        {(page) => (
          <TimelineDay
            page={page}
            dimmed={timeline.isPlaceholderData}
            onDay={setDay}
          />
        )}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  dimmed: { opacity: 0.6 },
  rows: { gap: 2 },
  time: { fontVariant: ["tabular-nums"] },
});
