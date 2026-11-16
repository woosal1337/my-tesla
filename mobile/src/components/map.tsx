import type { LngLat, MapMarker, MapPlace } from "@contract";
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  TransformRequestManager,
  type InitialViewState,
} from "@maplibre/maplibre-react-native";
import { useEffect, useReducer, useState, type ReactNode } from "react";
import {
  Animated,
  StyleSheet,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useSettings } from "@/api/queries";
import { basemapKeyOf } from "@/api/responses";
import { motion, space } from "@/theme/tokens";
import { usePalette } from "@/theme/use-palette";
import { useReducedMotion } from "@/theme/use-reduced-motion";
import { coverAfter, type MapCover } from "./map-cover";
import {
  boundsOf,
  lines,
  markerPoints,
  placePoints,
  routeEnds,
} from "./map-geometry";
import { screenPadding } from "./screen";
import { TeslaMark } from "./tesla-mark";
import { Text } from "./text";

const mapStyles = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

const labelLayer = "watername_ocean";

const carZoom = 15;
const fitPadding = { top: 48, right: 48, bottom: 48, left: 48 };

const basemapKeyId = "carto-basemap-key";

const coverLimitMs = 8000;

function useBasemapKey(): void {
  const key = basemapKeyOf(useSettings().data);
  useEffect(() => {
    if (!key) {
      TransformRequestManager.removeUrlSearchParam(basemapKeyId);
      return;
    }
    TransformRequestManager.addUrlSearchParam({
      id: basemapKeyId,
      match: "^https://([a-z0-9-]+\\.)*cartocdn\\.com/",
      name: "key",
      value: key,
    });
  }, [key]);
}

function useMapStyle(): string {
  const scheme = useColorScheme();
  const settings = useSettings();
  const chosen = settings.data?.groups
    .flatMap((group) => group.items)
    .find((item) => item.key === "mapTheme")?.value;
  if (chosen === "light" || chosen === "dark") return mapStyles[chosen];
  return scheme === "dark" ? mapStyles.dark : mapStyles.light;
}

export type MapSize = "hero" | "card";

const heightShare: Record<MapSize, number> = { hero: 0.46, card: 0.38 };

function useMapHeight(size: MapSize): number {
  const { height } = useWindowDimensions();
  return Math.round(Math.min(560, Math.max(260, height * heightShare[size])));
}

function Cover({ cover }: { cover: MapCover }) {
  const palette = usePalette();
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    if (cover !== "lifted" || reduced) return;
    const fade = Animated.timing(opacity, {
      toValue: 0,
      duration: motion.durationMs,
      easing: motion.easing,
      useNativeDriver: true,
    });
    fade.start(({ finished }) => setFaded(finished));
    return () => fade.stop();
  }, [cover, opacity, reduced]);

  if (faded || (cover === "lifted" && reduced)) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.cover,
        { backgroundColor: palette.card, opacity },
      ]}
    >
      {cover === "failed" ? (
        <Text variant="label">The map did not load.</Text>
      ) : (
        <TeslaMark size={44} kind="breathe" />
      )}
    </Animated.View>
  );
}

function MapCanvas({
  label,
  size,
  view,
  children,
}: {
  label: string;
  size: MapSize;
  view: InitialViewState;
  children: ReactNode;
}) {
  const palette = usePalette();
  useBasemapKey();
  const mapStyle = useMapStyle();
  const height = useMapHeight(size);
  const [settled, setSettled] = useState(false);
  const [cover, signal] = useReducer(coverAfter, "loading");

  useEffect(() => {
    const mount = setTimeout(() => setSettled(true), motion.durationMs);
    const limit = setTimeout(() => signal("timeout"), coverLimitMs);
    return () => {
      clearTimeout(mount);
      clearTimeout(limit);
    };
  }, []);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        cover === "failed" ? `${label}. The map did not load.` : label
      }
      accessibilityState={{ busy: cover === "loading" }}
      style={[styles.frame, { height, backgroundColor: palette.card }]}
    >
      {settled ? (
        <Map
          style={StyleSheet.absoluteFill}
          mapStyle={mapStyle}
          dragPan={false}
          touchRotate={false}
          touchPitch={false}
          compass={false}
          logo={false}
          attributionPosition={{ bottom: 8, right: screenPadding }}
          onDidFinishRenderingMapFully={() => signal("rendered")}
          onDidFailLoadingMap={() => signal("failed")}
        >
          <Camera initialViewState={view} />
          {children}
        </Map>
      ) : null}
      <Cover cover={cover} />
    </View>
  );
}

function CarDot() {
  const palette = usePalette();
  const reduced = useReducedMotion();
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: motion.durationMs * 5,
        easing: motion.easing,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduced]);

  return (
    <View style={styles.car}>
      {reduced ? null : (
        <Animated.View
          style={[
            styles.ring,
            {
              backgroundColor: palette.primary,
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.35, 0],
              }),
              transform: [
                {
                  scale: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.6],
                  }),
                },
              ],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            backgroundColor: palette.primary,
            borderColor: palette.primaryForeground,
          },
        ]}
      />
    </View>
  );
}

export function LocationMap({
  latitude,
  longitude,
  label,
  size,
}: {
  latitude: number;
  longitude: number;
  label: string;
  size: MapSize;
}) {
  const center: LngLat = [longitude, latitude];
  return (
    <MapCanvas label={label} size={size} view={{ center, zoom: carZoom }}>
      <Marker id="car" lngLat={center}>
        <CarDot />
      </Marker>
    </MapCanvas>
  );
}

function Markers({ markers }: { markers: readonly MapMarker[] }) {
  const palette = usePalette();
  const white = palette.primaryForeground;
  return (
    <GeoJSONSource id="markers" data={markerPoints(markers)}>
      <Layer
        id="marker-dots"
        type="circle"
        paint={{
          "circle-radius": ["match", ["get", "kind"], ["end", "charge"], 5, 4],
          "circle-color": [
            "match",
            ["get", "kind"],
            "end",
            palette.primary,
            "charge",
            palette.charge,
            palette.background,
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": [
            "match",
            ["get", "kind"],
            "start",
            palette.foreground,
            "stop",
            palette.primary,
            white,
          ],
        }}
      />
    </GeoJSONSource>
  );
}

export function RouteMap({
  routes,
  markers,
  label,
  width = 4,
}: {
  routes: readonly LngLat[][];
  markers?: readonly MapMarker[];
  label: string;
  width?: number;
}) {
  const palette = usePalette();
  const bounds = boundsOf([
    ...routes.flat(),
    ...(markers ?? []).map((marker): LngLat => [
      marker.longitude,
      marker.latitude,
    ]),
  ]);
  if (!bounds) return null;
  const ends =
    markers ?? (routes.length === 1 && routes[0] ? routeEnds(routes[0]) : []);
  return (
    <MapCanvas label={label} size="hero" view={{ bounds, padding: fitPadding }}>
      <GeoJSONSource id="route" data={lines(routes)}>
        <Layer
          id="route-line"
          type="line"
          beforeId={labelLayer}
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={{ "line-color": palette.primary, "line-width": width }}
        />
      </GeoJSONSource>
      <Markers markers={ends} />
    </MapCanvas>
  );
}

function Legend() {
  const palette = usePalette();
  return (
    <View style={styles.legend}>
      {[
        { label: "Visited", color: palette.primary },
        { label: "Charged", color: palette.charge },
      ].map((entry) => (
        <View key={entry.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: entry.color }]} />
          <Text variant="caption">{entry.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function MapSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="label" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

export function PlacesMap({ places }: { places: readonly MapPlace[] }) {
  const palette = usePalette();
  const bounds = boundsOf(
    places.map((place): LngLat => [place.longitude, place.latitude]),
  );
  if (!bounds) return null;
  return (
    <View style={styles.places}>
      <MapCanvas
        label={`Map of ${places.length} places`}
        size="hero"
        view={{ bounds, padding: fitPadding }}
      >
        <GeoJSONSource id="places" data={placePoints(places)}>
          <Layer
            id="place-dots"
            type="circle"
            paint={{
              "circle-radius": [
                "-",
                ["get", "radius"],
                ["match", ["get", "kind"], "both", 3, 2],
              ],
              "circle-color": [
                "match",
                ["get", "kind"],
                "charge",
                palette.charge,
                palette.primary,
              ],
              "circle-stroke-width": ["match", ["get", "kind"], "both", 3, 2],
              "circle-stroke-color": [
                "match",
                ["get", "kind"],
                "both",
                palette.charge,
                palette.primaryForeground,
              ],
            }}
          />
        </GeoJSONSource>
      </MapCanvas>
      <Legend />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", marginHorizontal: -screenPadding },
  cover: { alignItems: "center", justifyContent: "center" },
  car: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: { position: "absolute", width: 24, height: 24, borderRadius: 12 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  places: { gap: space.md },
  section: { gap: space.md, marginTop: space.sm },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: space.lg,
    rowGap: space.xs,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: space.sm },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
});
