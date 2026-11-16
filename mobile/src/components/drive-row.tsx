import type { DriveRow } from "@contract";
import { useRouter } from "expo-router";
import { targetHref, type TabStack } from "@/navigation/targets";
import { toneColor } from "@/theme/tones";
import { usePalette } from "@/theme/use-palette";
import { ChargeListRow } from "./charge-row";
import { ListRow, RowTime } from "./list-row";
import { TripStrip } from "./strips";
import { Text } from "./text";

export function DriveListRow({
  row,
  stack,
}: {
  row: DriveRow;
  stack: TabStack;
}) {
  const router = useRouter();
  const palette = usePalette();
  if (row.charge) return <ChargeListRow row={row.charge} stack={stack} />;
  const consumption = row.consumption;
  return (
    <ListRow
      label={
        row.label ??
        [
          row.clock,
          row.duration,
          row.title,
          row.subtitle,
          row.distance,
          consumption.text,
        ].join(", ")
      }
      onPress={() => router.push(targetHref(row.target, stack))}
      start={<RowTime clock={row.clock} caption={row.duration} />}
      title={row.title}
      subtitle={row.subtitle}
      accessory={<TripStrip segments={row.segments} />}
      end={
        <>
          <Text variant="strong" numberOfLines={1}>
            {row.distance}
          </Text>
          <Text
            variant="caption"
            numberOfLines={1}
            color={
              consumption.tone
                ? toneColor(palette, consumption.tone)
                : palette.subtle
            }
          >
            {consumption.text}
          </Text>
        </>
      }
    />
  );
}
