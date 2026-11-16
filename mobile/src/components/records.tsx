import type { AppRecord } from "@contract";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { targetHref, type TabStack } from "@/navigation/targets";
import { radius, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { ChargerBadge } from "./charger-badge";
import { dottedLine } from "./summary-line";
import { Text } from "./text";

function recordLabel(row: AppRecord): string {
  return [
    row.rank === null ? null : `${row.rank}.`,
    row.title,
    row.badge,
    row.value,
    row.detail,
    row.note,
  ]
    .filter(Boolean)
    .join(", ");
}

function Record({ row, stack }: { row: AppRecord; stack: TabStack }) {
  const router = useRouter();
  const palette = usePalette();
  const target = row.target;
  const body = (
    <>
      <View style={styles.line}>
        {row.rank !== null ? (
          <Text variant="label" tone="subtle" style={styles.rank}>
            {row.rank}
          </Text>
        ) : null}
        <View style={styles.title}>
          {row.badge ? <ChargerBadge fast={row.badge === "DC"} /> : null}
          <Text variant="strong" style={styles.titleText}>
            {row.title}
          </Text>
        </View>
        {row.value ? (
          <Text variant="label" tone="foreground" style={styles.value}>
            {row.value}
          </Text>
        ) : null}
      </View>
      <View style={[styles.below, row.rank !== null && styles.indent]}>
        {row.bar ? (
          <View style={[styles.track, { backgroundColor: palette.muted }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${row.bar.share * 100}%`,
                  backgroundColor:
                    row.bar.color === "charge"
                      ? palette.charge
                      : palette.primary,
                },
              ]}
            />
          </View>
        ) : null}
        {row.detail ? (
          <Text variant="caption">{dottedLine(row.detail)}</Text>
        ) : null}
        {row.note ? <Text variant="caption">{row.note}</Text> : null}
      </View>
    </>
  );
  return (
    <View style={styles.record}>
      {target ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={recordLabel(row)}
          onPress={() =>
            router.push(targetHref(target, stack), { withAnchor: true })
          }
          style={({ pressed }) => [styles.press, pressed && styles.pressed]}
        >
          {body}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={recordLabel(row)}>
          {body}
        </View>
      )}
      {row.links.length ? (
        <View style={[styles.links, row.rank !== null && styles.indent]}>
          {row.links.map((link) => (
            <Pressable
              key={link.label}
              accessibilityRole="link"
              accessibilityLabel={link.label}
              onPress={() =>
                router.push(targetHref(link.target, stack), {
                  withAnchor: true,
                })
              }
              style={({ pressed }) => [styles.link, pressed && styles.pressed]}
            >
              <Text
                variant="caption"
                tone="secondaryForeground"
                style={styles.linkText}
              >
                {link.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function Records({
  rows,
  stack,
}: {
  rows: AppRecord[];
  stack: TabStack;
}) {
  return (
    <View style={styles.list}>
      {rows.map((row) => (
        <Record key={row.key} row={row} stack={stack} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.lg },
  record: { gap: space.sm },
  press: { borderRadius: radius.control },
  pressed: { opacity: 0.6 },
  line: { flexDirection: "row", alignItems: "center", gap: space.md },
  rank: { width: 20, fontVariant: ["tabular-nums"] },
  title: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.sm,
  },
  titleText: { flexShrink: 1 },
  value: { flexShrink: 0, fontVariant: ["tabular-nums"] },
  below: { gap: space.xs },
  indent: { marginLeft: 32 },
  track: {
    marginTop: space.sm,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
  links: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: space.lg,
    marginVertical: -space.sm,
  },
  link: { minHeight: 48, minWidth: 48, justifyContent: "center" },
  linkText: { textDecorationLine: "underline" },
});
