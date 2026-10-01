"use client";

import { LocateFixed, MapPinOff } from "lucide-react";
import { useEffect } from "react";
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map";
import { routeBounds, type LngLat } from "@/lib/route";

const electricBlue = "#3e6ae1";

const quietMap = {
  cooperativeGestures: true,
  dragRotate: false,
  pitchWithRotate: false,
  touchPitch: false,
  attributionControl: { compact: true },
} as const;

const carZoom = 15;

function RecenterControl({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}) {
  const { map } = useMap();
  return (
    <div className="absolute top-2 left-2 z-10 overflow-hidden rounded-md border border-border bg-background shadow-sm">
      <button
        type="button"
        aria-label="Center on the car"
        onClick={() =>
          map?.flyTo({
            center: [longitude, latitude],
            zoom: carZoom,
            duration: 700,
          })
        }
        className="flex size-8 items-center justify-center transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset dark:hover:bg-accent/40"
      >
        <LocateFixed className="size-4" />
      </button>
    </div>
  );
}

function CollapsedAttribution() {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const collapse = () =>
      map
        .getContainer()
        .querySelector(".maplibregl-ctrl-attrib")
        ?.classList.remove("maplibregl-compact-show");
    collapse();
    map.on("styledata", collapse);
    map.once("idle", collapse);
    return () => {
      map.off("styledata", collapse);
    };
  }, [map]);

  return null;
}

function CarDot() {
  return (
    <span className="relative grid size-6 place-items-center">
      <span className="absolute inset-0 animate-ping rounded-full bg-primary/35" />
      <span className="size-3.5 rounded-full border-2 border-white bg-primary" />
    </span>
  );
}

function EndPoint({ kind }: { kind: "start" | "end" }) {
  return kind === "start" ? (
    <span className="block size-3 rounded-full border-2 border-foreground bg-background" />
  ) : (
    <span className="block size-3.5 rounded-full border-2 border-white bg-primary" />
  );
}

type MapTheme = "light" | "dark" | undefined;

export function MapsOff() {
  return (
    <div className="grid h-full place-items-center bg-muted/40 text-sm text-subtle">
      <span className="flex items-center gap-2">
        <MapPinOff className="size-4" />
        Maps are off in Settings.
      </span>
    </div>
  );
}

export function LocationMap({
  longitude,
  latitude,
  theme,
}: {
  longitude: number;
  latitude: number;
  theme?: MapTheme;
}) {
  return (
    <Map
      center={[longitude, latitude]}
      zoom={carZoom}
      theme={theme}
      {...quietMap}
    >
      <CollapsedAttribution />
      <MapControls position="top-right" showZoom />
      <RecenterControl longitude={longitude} latitude={latitude} />
      <MapMarker longitude={longitude} latitude={latitude}>
        <MarkerContent>
          <CarDot />
        </MarkerContent>
      </MapMarker>
    </Map>
  );
}

export function RouteMap({
  route,
  theme,
}: {
  route: LngLat[];
  theme?: MapTheme;
}) {
  const bounds = routeBounds(route);
  if (!bounds) {
    return (
      <div className="grid h-full place-items-center text-sm text-subtle">
        TeslaMate stored no positions for this drive.
      </div>
    );
  }
  const [start, end] = [route[0], route.at(-1) ?? route[0]];
  return (
    <Map
      bounds={bounds}
      fitBoundsOptions={{ padding: 56, maxZoom: 16 }}
      theme={theme}
      {...quietMap}
    >
      <CollapsedAttribution />
      <MapControls position="top-right" showZoom />
      <MapRoute coordinates={route} color={electricBlue} width={4} />
      <MapMarker longitude={start[0]} latitude={start[1]}>
        <MarkerContent>
          <EndPoint kind="start" />
        </MarkerContent>
      </MapMarker>
      <MapMarker longitude={end[0]} latitude={end[1]}>
        <MarkerContent>
          <EndPoint kind="end" />
        </MarkerContent>
      </MapMarker>
    </Map>
  );
}

export type MapPlace = {
  key: string;
  label: string;
  detail: string;
  latitude: number;
  longitude: number;
  weight: number;
  kind: "visit" | "charge" | "both";
};

const placeDotTone: Record<MapPlace["kind"], string> = {
  visit: "border-2 border-white bg-primary",
  charge: "border-2 border-white bg-charge",
  both: "border-[3px] border-charge bg-primary",
};

function PlaceDot({ size, kind }: { size: number; kind: MapPlace["kind"] }) {
  return (
    <span
      className={`block rounded-full ${placeDotTone[kind]}`}
      style={{ width: size, height: size }}
    />
  );
}

export function PlacesMap({
  places,
  theme,
}: {
  places: MapPlace[];
  theme?: MapTheme;
}) {
  const bounds = routeBounds(
    places.map((place): LngLat => [place.longitude, place.latitude]),
  );
  if (!bounds) return null;
  const heaviest = Math.max(1, ...places.map((place) => place.weight));
  return (
    <Map
      bounds={bounds}
      fitBoundsOptions={{ padding: 64, maxZoom: 14 }}
      theme={theme}
      {...quietMap}
    >
      <CollapsedAttribution />
      <MapControls position="top-right" showZoom />
      {places.map((place) => (
        <MapMarker
          key={`${place.kind}-${place.key}`}
          longitude={place.longitude}
          latitude={place.latitude}
        >
          <MarkerContent>
            <PlaceDot
              kind={place.kind}
              size={12 + Math.round(20 * Math.sqrt(place.weight / heaviest))}
            />
          </MarkerContent>
          <MarkerTooltip>
            <span className="font-medium">{place.label}</span>
            <span className="opacity-70"> · {place.detail}</span>
          </MarkerTooltip>
        </MapMarker>
      ))}
    </Map>
  );
}
