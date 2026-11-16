import type { OverviewMenuKey, OverviewPage } from "@contract";
import { useRouter, type Href } from "expo-router";
import { Linking, StyleSheet, useWindowDimensions, View } from "react-native";
import { useLiveChanges } from "@/api/live";
import { useOverview, type InsightKind } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { CarStage } from "@/components/car-stage";
import { CarTitle } from "@/components/car-title";
import { icons, type IconName } from "@/components/icons";
import { MenuRow } from "@/components/menu-row";
import { QuickActions, type QuickAction } from "@/components/quick-actions";
import { EmptyState, QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { useRefresh } from "@/hooks/use-refresh";
import { requestInsight } from "@/navigation/insight-request";
import { mapsUrl } from "@/navigation/maps";
import { useOpenTab } from "@/navigation/open-tab";
import { space } from "@/theme/tokens";

const wideWidth = 720;

const menuLinks: Record<
  OverviewMenuKey,
  { icon: IconName; href: Href; insight?: InsightKind }
> = {
  drives: { icon: icons.drive, href: "/drives" },
  charging: { icon: icons.charge, href: "/charging" },
  battery: { icon: icons.battery, href: "/insights", insight: "battery" },
  stats: { icon: icons.stats, href: "/insights", insight: "stats" },
  places: { icon: icons.places, href: "/insights", insight: "places" },
  location: { icon: icons.location, href: "/location" },
  status: { icon: icons.status, href: "/status" },
  settings: { icon: icons.settings, href: "/settings" },
};

function Menu({ page }: { page: OverviewPage }) {
  const openTab = useOpenTab();
  return (
    <View style={styles.menu}>
      {page.menu.map((row) => {
        const link = menuLinks[row.key];
        return (
          <MenuRow
            key={row.key}
            icon={link.icon}
            title={row.title}
            subtitle={row.subtitle}
            onPress={() => {
              if (link.insight) requestInsight(link.insight);
              openTab(link.href);
            }}
          />
        );
      })}
    </View>
  );
}

function useActions(page: OverviewPage): QuickAction[] {
  const router = useRouter();
  const location = page.location;
  return [
    {
      key: "timeline",
      icon: icons.timeline,
      label: "Timeline",
      onPress: () => router.navigate("/drives/timeline", { withAnchor: true }),
    },
    {
      key: "report",
      icon: icons.report,
      label: "Report",
      onPress: () => router.navigate("/drives/report", { withAnchor: true }),
    },
    {
      key: "year",
      icon: icons.year,
      label: "Year",
      onPress: () => router.navigate("/insights/year", { withAnchor: true }),
    },
    ...(location
      ? [
          {
            key: "maps",
            icon: icons.maps,
            label: "Maps",
            onPress: () =>
              Linking.openURL(
                mapsUrl(location.latitude, location.longitude, page.car.name),
              ),
          },
        ]
      : []),
  ];
}

function Stage({ page }: { page: OverviewPage }) {
  const actions = useActions(page);
  return (
    <View style={styles.stage}>
      <CarStage
        key={page.car.image}
        image={page.car.image}
        imageFrame={page.car.imageFrame}
        name={page.car.name}
        callouts={page.callouts}
      />
      {page.empty ? (
        <EmptyState
          title={`No data from ${page.car.name} yet`}
          text={page.empty}
        />
      ) : null}
      <QuickActions actions={actions} />
    </View>
  );
}

function PhoneOverview({ page }: { page: OverviewPage }) {
  return (
    <>
      <CarTitle page={page} />
      <Stage page={page} />
      <Menu page={page} />
    </>
  );
}

function WideOverview({ page }: { page: OverviewPage }) {
  return (
    <View style={styles.wide}>
      <View style={styles.sidebar}>
        <CarTitle page={page} />
        <Menu page={page} />
      </View>
      <View style={styles.main}>
        <Stage page={page} />
      </View>
    </View>
  );
}

export default function OverviewScreen() {
  const { car } = useCar();
  const overview = useOverview(car.id);
  useLiveChanges(car.id, ["overview", car.id]);
  const refresh = useRefresh(overview);
  const wide = useWindowDimensions().width >= wideWidth;
  return (
    <Screen
      withoutHeader
      refreshing={refresh.refreshing}
      onRefresh={refresh.onRefresh}
    >
      <QueryView query={overview}>
        {(page) =>
          wide ? <WideOverview page={page} /> : <PhoneOverview page={page} />
        }
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { flexGrow: 1, gap: space.lg },
  menu: { marginHorizontal: -space.lg },
  wide: { flexDirection: "row", gap: space.xxl },
  sidebar: { width: 320, gap: space.xl },
  main: { flex: 1, minWidth: 0 },
});
