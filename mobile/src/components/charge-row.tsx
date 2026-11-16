import type { ChargeRow } from "@contract";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { targetHref, type TabStack } from "@/navigation/targets";
import { space } from "@/theme/tokens";
import { ChargerBadge } from "./charger-badge";
import { ListRow, RowTime } from "./list-row";
import { LevelBar } from "./strips";
import { Text } from "./text";

export function ChargeListRow({
  row,
  stack,
}: {
  row: ChargeRow;
  stack: TabStack;
}) {
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
        router.push(targetHref({ kind: "charge", id: row.id }, stack))
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

const styles = StyleSheet.create({
  title: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  place: { flexShrink: 1 },
});
