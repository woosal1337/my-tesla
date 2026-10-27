import type { PushEvent, SettingItem, SettingsPage } from "@contract";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { unregisterAlerts, useAlertChoices } from "@/alerts/use-alerts";
import {
  signOutPhone,
  useMe,
  usePushCatalog,
  useSettingChange,
  useSettings,
  useSettingsBusy,
  type SettingChange,
} from "@/api/queries";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { Icon } from "@/components/icon";
import { icons } from "@/components/icons";
import { ListRow } from "@/components/list-row";
import { Panel } from "@/components/panel";
import { QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { SegmentedControl } from "@/components/segmented-control";
import { StatGrid } from "@/components/stat";
import { SwitchRow } from "@/components/switch-row";
import { Text } from "@/components/text";
import { useConnection } from "@/connection/connection-provider";
import { useForgetPhone } from "@/connection/use-forget-phone";
import { useRefresh } from "@/hooks/use-refresh";
import {
  readThemeChoice,
  saveThemeChoice,
  themeChoices,
} from "@/theme/appearance";
import { space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";

type ChoiceItem = Extract<SettingItem, { kind: "choice" }>;
type PriceItem = Extract<SettingItem, { kind: "price" }>;

function ThemePanel() {
  const [choice, setChoice] = useState(readThemeChoice);
  return (
    <Panel title="Appearance">
      <SegmentedControl
        label="Theme"
        items={themeChoices}
        value={choice}
        onChange={(next) => {
          saveThemeChoice(next);
          setChoice(next);
        }}
      />
      <Text variant="caption">This phone keeps the theme.</Text>
    </Panel>
  );
}

function ChoiceRow({ item, busy }: { item: ChoiceItem; busy: boolean }) {
  const router = useRouter();
  const palette = usePalette();
  const current =
    item.options.find((option) => option.id === item.value)?.label ??
    item.value;
  return (
    <ListRow
      label={`${item.label}, ${current}`}
      title={item.label}
      subtitle={current}
      disabled={busy}
      end={<Icon name={icons.chevron} color={palette.subtle} size={14} />}
      onPress={() =>
        router.push({
          pathname: "/settings/[key]",
          params: { key: item.key },
        })
      }
    />
  );
}

function priceText(value: number | null): string {
  return value === null ? "" : String(value);
}

function PriceField({
  item,
  onSave,
}: {
  item: PriceItem;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(priceText(item.value));
  return (
    <View style={styles.price}>
      <Field
        label={item.label}
        value={text}
        onChangeText={setText}
        placeholder="Not set"
        keyboardType="decimal-pad"
        onEndEditing={() => {
          if (text.trim() !== priceText(item.value)) onSave(text.trim());
        }}
      />
      {item.hint ? <Text variant="caption">{item.hint}</Text> : null}
    </View>
  );
}

function SettingControl({
  item,
  busy,
  change,
}: {
  item: SettingItem;
  busy: boolean;
  change: (change: SettingChange) => void;
}) {
  if (item.kind === "choice") return <ChoiceRow item={item} busy={busy} />;
  if (item.kind === "price") {
    return (
      <PriceField
        item={item}
        onSave={(text) => change({ key: item.key, value: text })}
      />
    );
  }
  return (
    <SwitchRow
      label={item.label}
      detail={item.hint}
      value={item.value}
      disabled={busy}
      onChange={(on) => change({ key: item.key, value: on })}
    />
  );
}

function SettingGroups({ page }: { page: SettingsPage }) {
  const change = useSettingChange();
  const busy = useSettingsBusy();
  return (
    <>
      <Panel title="Preview">
        <StatGrid stats={page.preview} />
      </Panel>
      {page.groups.map((group) => (
        <Panel key={group.title} title={group.title}>
          {group.items.map((item) => (
            <SettingControl
              key={item.key}
              item={item}
              busy={busy}
              change={(next) => change.mutate(next)}
            />
          ))}
          {change.error &&
          group.items.some((item) => item.key === change.variables?.key) ? (
            <Text variant="label" tone="destructive">
              {change.error.message}
            </Text>
          ) : null}
          {group.note ? <Text variant="caption">{group.note}</Text> : null}
        </Panel>
      ))}
    </>
  );
}

function AlertSwitches({ events }: { events: readonly PushEvent[] }) {
  const { chosen, update, test } = useAlertChoices(events);
  const busy = update.isPending || test.isPending;
  const toggle = (id: string, on: boolean) =>
    update.mutate(
      on ? [...chosen, id] : chosen.filter((entry) => entry !== id),
    );
  return (
    <>
      {events.map((event) => (
        <SwitchRow
          key={event.id}
          label={event.title}
          detail={event.description}
          value={chosen.includes(event.id)}
          disabled={busy}
          onChange={(on) => toggle(event.id, on)}
        />
      ))}
      {update.error || test.error ? (
        <Text variant="label" tone="destructive">
          {(update.error ?? test.error)?.message}
        </Text>
      ) : null}
      {test.isSuccess ? (
        <Text variant="label">The server sent a test alert.</Text>
      ) : null}
      <Button
        label="Send a test alert"
        kind="secondary"
        busy={test.isPending}
        disabled={!chosen.length}
        onPress={() => test.mutate()}
      />
    </>
  );
}

function Alerts() {
  const palette = usePalette();
  const catalog = usePushCatalog();
  if (catalog.isPending) return <ActivityIndicator color={palette.subtle} />;
  if (catalog.error) return <Text>{catalog.error.message}</Text>;
  if (!catalog.data.enabled) {
    return (
      <Text>The server sends alerts only with the TeslaMate MQTT feed.</Text>
    );
  }
  return <AlertSwitches events={catalog.data.events} />;
}

function ServerPanel() {
  const connection = useConnection();
  const forgetPhone = useForgetPhone();
  const me = useMe();
  const signedIn = connection.token !== null;
  return (
    <Panel title="Account">
      {signedIn ? (
        <Text numberOfLines={1}>
          {me.data
            ? `${me.data.user.name} · ${me.data.user.email}`
            : "Signed in"}
        </Text>
      ) : (
        <Text>The demo needs no account.</Text>
      )}
      <Text variant="caption" numberOfLines={1}>
        {connection.url.replace(/^https?:\/\//, "")}
      </Text>
      <Button
        label={signedIn ? "Sign out" : "Disconnect"}
        kind="secondary"
        onPress={async () => {
          await unregisterAlerts(connection);
          await signOutPhone(connection);
          await forgetPhone(connection);
        }}
      />
    </Panel>
  );
}

export default function SettingsScreen() {
  const settings = useSettings();
  const refresh = useRefresh(settings);
  return (
    <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <ThemePanel />
      <QueryView query={settings}>
        {(page) => <SettingGroups page={page} />}
      </QueryView>
      <Panel title="Alerts">
        <Alerts />
      </Panel>
      <ServerPanel />
    </Screen>
  );
}

const styles = StyleSheet.create({
  price: { gap: space.sm },
});
