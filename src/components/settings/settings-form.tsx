"use client";

import { Check, LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react";
import { useLayoutEffect, useState, useTransition } from "react";
import {
  resetPreferences,
  savePreferences,
} from "@/app/cars/[carId]/settings/actions";
import { createFormatter } from "@/lib/format";
import { periods } from "@/lib/insights";
import {
  addressDetailOptions,
  autoCar,
  autoTimeZone,
  clockOptions,
  currencyOptions,
  distanceOptions,
  mapOptions,
  mapThemeOptions,
  motionOptions,
  numberStyleOptions,
  overviewKeys,
  placeNameOptions,
  pressureOptions,
  rangeOptions,
  refreshOptions,
  resolveTimeZone,
  tabKeys,
  temperatureOptions,
  themeOptions,
  weekStartOptions,
  type Preferences,
} from "@/lib/preferences";
import { unitLabels } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  Choice,
  Select,
  SettingRow,
  SettingsSection,
  Toggle,
} from "./controls";

const sample = {
  at: new Date("2026-09-08T11:05:00Z"),
  distanceKm: 152.4,
  temperatureC: 21.4,
  pressureBar: 2.9,
  whPerKm: 152,
  speedKmh: 118,
  cost: 1234.5,
};

const sections = [
  { id: "units", label: "Units" },
  { id: "time", label: "Date and time" },
  { id: "numbers", label: "Numbers" },
  { id: "location", label: "Location" },
  { id: "display", label: "Display" },
  { id: "tabs", label: "Tabs" },
  { id: "overview", label: "Overview" },
];

type Status = "idle" | "saving" | "saved" | "error";

function StatusChip({ status }: { status: Status }) {
  if (status === "idle") return null;
  const content = {
    saving: [
      <LoaderCircle key="i" className="size-3.5 animate-spin" />,
      "Saving",
    ],
    saved: [<Check key="i" className="size-3.5" />, "Saved"],
    error: [<TriangleAlert key="i" className="size-3.5" />, "Not saved"],
  }[status];
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1.5 rounded bg-card px-2.5 py-1 text-xs font-medium",
        status === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {content}
    </span>
  );
}

export function SettingsForm({
  initial,
  defaults,
  cars,
  timeZones,
  serverTimeZone,
  viewer,
}: {
  initial: Preferences;
  defaults: Preferences;
  cars: { id: number; name: string }[];
  timeZones: string[];
  serverTimeZone: string;
  viewer: string | null;
}) {
  const [preferences, setPreferences] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [, startTransition] = useTransition();
  const initialKey = JSON.stringify(initial);
  const [syncedKey, setSyncedKey] = useState(initialKey);
  if (initialKey !== syncedKey && status !== "saving") {
    setSyncedKey(initialKey);
    setPreferences(initial);
  }

  useLayoutEffect(() => () => setStatus("idle"), []);

  function commit(next: Preferences) {
    setPreferences(next);
    setStatus("saving");
    startTransition(async () => {
      const result = await savePreferences(next);
      setStatus(result.ok ? "saved" : "error");
    });
  }

  function set<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    commit({ ...preferences, [key]: value });
  }

  function reset() {
    setPreferences(defaults);
    setStatus("saving");
    startTransition(async () => {
      const result = await resetPreferences();
      setStatus(result.ok ? "saved" : "error");
    });
  }

  const timeZone = resolveTimeZone(preferences, serverTimeZone);
  const f = createFormatter(preferences, timeZone);
  const labels = unitLabels(preferences);
  const efficiencyOptions = [
    { id: "wh-per-distance", label: `Wh/${labels.distance}` },
    { id: "kwh-per-100", label: `kWh/100 ${labels.distance}` },
    { id: "distance-per-kwh", label: `${labels.distance}/kWh` },
  ] as const;
  const dateOrderOptions = [
    { id: "day-month", label: "8 Sep" },
    { id: "month-day", label: "Sep 8" },
    { id: "iso", label: "2026-09-08" },
  ] as const;
  const clockChoices = clockOptions.map((option) => ({
    ...option,
    label: option.id === "24h" ? "14:05" : "2:05 PM",
  }));
  const timeZoneOptions = [
    { id: autoTimeZone, label: `Automatic, ${serverTimeZone}` },
    ...timeZones.map((zone) => ({
      id: zone,
      label: zone.replaceAll("_", " "),
    })),
  ];
  const carOptions = [
    { id: autoCar, label: "The car that moved last" },
    ...cars.map((car) => ({ id: String(car.id), label: car.name })),
  ];
  const currencyChoices = currencyOptions.map((option) => ({
    ...option,
    label:
      option.id === "none" ? option.label : `${option.label}, ${option.id}`,
  }));

  return (
    <div className="pt-6 md:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {viewer ? `Saved for ${viewer}` : "Saved on this dashboard"}
          </p>
          <h1 className="mt-1 text-[32px] leading-[1.2] font-medium md:text-[40px]">
            Settings
          </h1>
        </div>
        <StatusChip status={status} />
      </div>

      <section
        aria-label="Preview"
        className="mt-8 rounded-xl border border-border p-5 md:p-6"
      >
        <p className="text-xs text-subtle">Preview</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
          {[
            ["Distance", f.distance(sample.distanceKm)],
            ["Speed", f.speed(sample.speedKmh)],
            ["Outside", f.temperature(sample.temperatureC)],
            ["Tire", f.pressure(sample.pressureBar)],
            ["Efficiency", f.efficiency(sample.whPerKm)],
            ["Cost", f.cost(sample.cost)],
            ["Date", f.day(sample.at, new Date("2026-10-01T09:00:00Z"))],
            ["Time", f.clock(sample.at)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-medium tabular">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-10 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10">
        <nav
          aria-label="Settings sections"
          className="sticky top-24 hidden self-start lg:block"
        >
          <ul className="space-y-1 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded px-3 py-1.5 text-muted-foreground transition-tesla hover:bg-card hover:text-foreground"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12">
          <SettingsSection
            id="units"
            title="Units"
            description="Every page, chart, and map label uses these units."
          >
            <SettingRow
              label="Distance"
              hint="Also sets speed, range, and elevation."
              control={
                <Choice
                  label="Distance"
                  value={preferences.distance}
                  options={distanceOptions}
                  onChange={(value) => set("distance", value)}
                />
              }
            />
            <SettingRow
              label="Temperature"
              control={
                <Choice
                  label="Temperature"
                  value={preferences.temperature}
                  options={temperatureOptions}
                  onChange={(value) => set("temperature", value)}
                />
              }
            />
            <SettingRow
              label="Tire pressure"
              control={
                <Choice
                  label="Tire pressure"
                  value={preferences.pressure}
                  options={pressureOptions}
                  onChange={(value) => set("pressure", value)}
                />
              }
            />
            <SettingRow
              label="Efficiency"
              hint="Energy for each distance, or distance for each kWh."
              control={
                <Choice
                  label="Efficiency"
                  value={preferences.efficiency}
                  options={efficiencyOptions}
                  onChange={(value) => set("efficiency", value)}
                />
              }
            />
            <SettingRow
              label="Range"
              hint="Rated follows the official test figure. Ideal follows the older Tesla figure."
              control={
                <Choice
                  label="Range"
                  value={preferences.range}
                  options={rangeOptions}
                  onChange={(value) => set("range", value)}
                />
              }
            />
          </SettingsSection>

          <SettingsSection id="time" title="Date and time">
            <SettingRow
              label="Time zone"
              hint="Days, hours, and charts use this time zone."
              control={
                <Select
                  label="Time zone"
                  value={preferences.timeZone}
                  options={timeZoneOptions}
                  onChange={(value) => set("timeZone", value)}
                />
              }
            />
            <SettingRow
              label="Clock"
              control={
                <Choice
                  label="Clock"
                  value={preferences.clock}
                  options={clockChoices}
                  onChange={(value) => set("clock", value)}
                />
              }
            />
            <SettingRow
              label="Date"
              control={
                <Choice
                  label="Date"
                  value={preferences.dateOrder}
                  options={dateOrderOptions}
                  onChange={(value) => set("dateOrder", value)}
                />
              }
            />
            <SettingRow
              label="First day of the week"
              hint="Sets the weekly bars and the drive heat map."
              control={
                <Choice
                  label="First day of the week"
                  value={preferences.weekStart}
                  options={weekStartOptions}
                  onChange={(value) => set("weekStart", value)}
                />
              }
            />
          </SettingsSection>

          <SettingsSection id="numbers" title="Numbers">
            <SettingRow
              label="Number style"
              control={
                <Choice
                  label="Number style"
                  value={preferences.numberStyle}
                  options={numberStyleOptions}
                  onChange={(value) => set("numberStyle", value)}
                />
              }
            />
            <SettingRow
              label="Currency"
              hint="TeslaMate stores costs without a currency."
              control={
                <Select
                  label="Currency"
                  value={preferences.currency}
                  options={currencyChoices}
                  onChange={(value) => set("currency", value)}
                />
              }
            />
          </SettingsSection>

          <SettingsSection
            id="location"
            title="Location"
            description="The data is a location history. Hide the maps before you share the screen."
          >
            <SettingRow
              label="Place names"
              hint="A geofence is a place that you name in TeslaMate."
              control={
                <Choice
                  label="Place names"
                  value={preferences.placeNames}
                  options={placeNameOptions}
                  onChange={(value) => set("placeNames", value)}
                />
              }
            />
            <SettingRow
              label="Address detail"
              control={
                <Choice
                  label="Address detail"
                  value={preferences.addressDetail}
                  options={addressDetailOptions}
                  onChange={(value) => set("addressDetail", value)}
                />
              }
            />
            <SettingRow
              label="Maps"
              control={
                <Choice
                  label="Maps"
                  value={preferences.maps}
                  options={mapOptions}
                  onChange={(value) => set("maps", value)}
                />
              }
            />
            <SettingRow
              label="Map theme"
              control={
                <Choice
                  label="Map theme"
                  value={preferences.mapTheme}
                  options={mapThemeOptions}
                  onChange={(value) => set("mapTheme", value)}
                />
              }
            />
          </SettingsSection>

          <SettingsSection id="display" title="Display">
            <SettingRow
              label="Theme"
              control={
                <Choice
                  label="Theme"
                  value={preferences.theme}
                  options={themeOptions}
                  onChange={(value) => set("theme", value)}
                />
              }
            />
            <SettingRow
              label="Motion"
              hint="Reduced turns off the slides between screens."
              control={
                <Choice
                  label="Motion"
                  value={preferences.motion}
                  options={motionOptions}
                  onChange={(value) => set("motion", value)}
                />
              }
            />
            <SettingRow
              inline
              label="Start screen"
              hint="Show the T mark when the dashboard opens."
              control={
                <Toggle
                  label="Start screen"
                  checked={preferences.splash}
                  onChange={(value) => set("splash", value)}
                />
              }
            />
            <SettingRow
              label="Live refresh"
              hint="Reads new data while the tab is open."
              control={
                <Choice
                  label="Live refresh"
                  value={preferences.refresh}
                  options={refreshOptions}
                  onChange={(value) => set("refresh", value)}
                />
              }
            />
            <SettingRow
              label="Default period"
              hint="Battery, Stats, and Places open with this period."
              control={
                <Choice
                  label="Default period"
                  value={preferences.period}
                  options={periods}
                  onChange={(value) => set("period", value)}
                />
              }
            />
            <SettingRow
              label="Start car"
              hint="The dashboard opens on this car."
              control={
                <Select
                  label="Start car"
                  value={preferences.defaultCar}
                  options={carOptions}
                  onChange={(value) => set("defaultCar", value)}
                />
              }
            />
          </SettingsSection>

          <SettingsSection
            id="tabs"
            title="Tabs"
            description="Overview and Settings always show."
          >
            {tabKeys.map((tab) => (
              <SettingRow
                inline
                key={tab.id}
                label={tab.label}
                control={
                  <Toggle
                    label={`Show ${tab.label}`}
                    checked={preferences.tabs[tab.id]}
                    onChange={(value) =>
                      set("tabs", { ...preferences.tabs, [tab.id]: value })
                    }
                  />
                }
              />
            ))}
          </SettingsSection>

          <SettingsSection
            id="overview"
            title="Overview"
            description="Choose the cards on the Overview page."
          >
            {overviewKeys.map((card) => (
              <SettingRow
                inline
                key={card.id}
                label={card.label}
                control={
                  <Toggle
                    label={`Show ${card.label}`}
                    checked={preferences.overview[card.id]}
                    onChange={(value) =>
                      set("overview", {
                        ...preferences.overview,
                        [card.id]: value,
                      })
                    }
                  />
                }
              />
            ))}
          </SettingsSection>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
            <p className="max-w-md text-sm text-muted-foreground">
              The defaults come from the TeslaMate settings:{" "}
              {unitLabels(defaults).distance},{" "}
              {unitLabels(defaults).temperature},{" "}
              {unitLabels(defaults).pressure}, and the {defaults.range} range.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-2 rounded bg-card px-5 text-sm font-medium transition-tesla hover:bg-accent"
            >
              <RotateCcw className="size-4" />
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
