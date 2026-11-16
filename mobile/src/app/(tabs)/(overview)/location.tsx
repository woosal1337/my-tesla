import { Linking, StyleSheet, View } from "react-native";
import { useOverview } from "@/api/queries";
import { useCar } from "@/car/car-provider";
import { Button } from "@/components/button";
import { LocationMap, MapSection } from "@/components/map";
import { EmptyState, QueryView } from "@/components/query-view";
import { Screen } from "@/components/screen";
import { Text } from "@/components/text";
import { useRefresh } from "@/hooks/use-refresh";
import { mapsUrl } from "@/navigation/maps";
import { space } from "@/theme/tokens";

export default function LocationScreen() {
  const { car } = useCar();
  const overview = useOverview(car.id);
  const refresh = useRefresh(overview);
  return (
    <Screen refreshing={refresh.refreshing} onRefresh={refresh.onRefresh}>
      <QueryView query={overview}>
        {(page) => {
          const location = page.location;
          if (!location) {
            return (
              <EmptyState
                title="No map"
                text="Maps are off in Settings, or TeslaMate has no position yet."
              />
            );
          }
          return (
            <MapSection title={`Where ${page.car.name} is`}>
              {location.place || location.since ? (
                <View accessible style={styles.place}>
                  {location.place ? (
                    <Text variant="heading">{location.place}</Text>
                  ) : null}
                  {location.since ? (
                    <Text variant="label">{location.since}</Text>
                  ) : null}
                </View>
              ) : null}
              <LocationMap
                size="hero"
                latitude={location.latitude}
                longitude={location.longitude}
                label={`Map of where ${page.car.name} is`}
              />
              <Text variant="label">{page.activity.updated}</Text>
              <Button
                label="Open in Maps"
                kind="secondary"
                onPress={() =>
                  Linking.openURL(
                    mapsUrl(
                      location.latitude,
                      location.longitude,
                      page.car.name,
                    ),
                  )
                }
              />
            </MapSection>
          );
        }}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  place: { gap: space.xs },
});
