import type { CarIdentity, OverviewPage } from "@contract";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useOverview } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { Icon } from "./icon";
import { icons } from "./icons";
import { dottedLine, summaryLine } from "./summary-line";
import { Text } from "./text";

function CarOption({
  entry,
  onPress,
}: {
  entry: CarIdentity;
  onPress: () => void;
}) {
  const page = useOverview(entry.id).data;
  const parts = [page?.battery?.value.text, page?.activity.label].filter(
    (part): part is string => Boolean(part),
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[`Show ${entry.name}`, ...parts].join(", ")}
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <Text variant="strong">{entry.name}</Text>
      <Text variant="label">{parts.length ? summaryLine(parts) : " "}</Text>
    </Pressable>
  );
}

export function CarTitle({ page }: { page: OverviewPage }) {
  const palette = usePalette();
  const { cars, car, choose } = useCar();
  const [open, setOpen] = useState(false);
  const others = cars.filter((entry) => entry.id !== car.id);
  return (
    <View style={styles.title}>
      <Pressable
        accessibilityRole={others.length ? "button" : "header"}
        accessibilityLabel={
          others.length ? `${page.car.name}, change the car` : page.car.name
        }
        accessibilityState={others.length ? { expanded: open } : undefined}
        disabled={!others.length}
        onPress={() => setOpen((value) => !value)}
        style={styles.name}
      >
        <Text variant="display" numberOfLines={1} style={styles.nameText}>
          {page.car.name}
        </Text>
        {others.length ? (
          <Icon
            name={open ? icons.chevronUp : icons.chevronDown}
            color={palette.mutedForeground}
            size={16}
          />
        ) : null}
      </Pressable>
      <Text variant="strong">{page.activity.label}</Text>
      <Text variant="caption">
        {dottedLine(
          `${page.car.variant} · ${page.activity.updated.toLowerCase()}`,
        )}
      </Text>
      {open && others.length ? (
        <View style={[styles.list, { backgroundColor: palette.card }]}>
          {others.map((entry) => (
            <CarOption
              key={entry.id}
              entry={entry}
              onPress={() => {
                choose(entry.id);
                setOpen(false);
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { gap: space.xs },
  name: { flexDirection: "row", alignItems: "center", gap: space.sm },
  nameText: { flexShrink: 1 },
  list: {
    marginTop: space.sm,
    borderRadius: radius.card,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  option: {
    minHeight: 48,
    gap: 2,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  pressed: { opacity: 0.6 },
});
