export type AppTone = "good" | "bad";

export type AppValue = {
  text: string;
  tone: AppTone | null;
  note: string | null;
};

export type AppStat = {
  label: string;
  value: AppValue;
  detail: string | null;
};

export type ChartColor =
  "chart1" | "chart2" | "chart3" | "chart4" | "chart5" | "charge";

export type AppChartSeries = {
  key: string;
  label: string;
  unit: string;
  color: ChartColor;
  kind: "area" | "line" | "bar" | "dot";
  axis: "left" | "right";
  digits: number;
};

export type AppTick = { value: number; label: string };

export type AppAxis = { domain: [number, number]; ticks: AppTick[] };

export type AppChart = {
  title: string;
  locale: string;
  series: AppChartSeries[];
  points: { x: number; label: string; values: (number | null)[] }[];
  x: AppAxis;
  left: AppAxis;
  right: AppAxis | null;
};

export type LngLat = [number, number];

export type MapMarker = {
  key: string;
  kind: "start" | "end" | "stop" | "charge";
  label: string;
  detail: string;
  latitude: number;
  longitude: number;
};

export type MapPlace = {
  key: string;
  label: string;
  detail: string;
  latitude: number;
  longitude: number;
  weight: number;
  kind: "visit" | "charge" | "both";
};

export type AppTarget =
  | { kind: "drive"; id: number }
  | { kind: "trip"; id: number }
  | { kind: "charge"; id: number }
  | { kind: "day"; day: string };

export type CarIdentity = {
  id: number;
  name: string;
  model: string;
  trim: string | null;
};

export type CarList = { cars: CarIdentity[]; defaultCarId: number | null };

export type PushEvent = { id: string; title: string; description: string };

export type PushCatalog = { enabled: boolean; events: readonly PushEvent[] };

export type DriveRow = {
  key: string;
  target: AppTarget;
  clock: string;
  duration: string;
  title: string;
  subtitle: string;
  segments: { kind: "drive" | "stop" | "charge"; share: number }[];
  distance: string;
  consumption: AppValue;
};

export type DaySection<Row> = { title: string; total?: string[]; rows: Row[] };

export type DriveList = {
  summary: string[];
  sections: DaySection<DriveRow>[];
};

export type DriveDetail = {
  title: string;
  subtitle: string;
  notice: string | null;
  stats: AppStat[];
  charts: AppChart[];
  route: LngLat[] | null;
  gpxPath: string;
};

export type TripStepRow = {
  key: string;
  kind: "drive" | "charge" | "stop";
  clock: string;
  title: string;
  detail: string;
  target: AppTarget | null;
};

export type TripDetail = {
  title: string;
  subtitle: string;
  stats: AppStat[];
  steps: TripStepRow[];
  routes: LngLat[][] | null;
  markers: MapMarker[] | null;
};

export type LevelRange = { start: number; end: number };

export type ChargeRow = {
  key: string;
  id: number;
  clock: string;
  duration: string;
  place: string;
  fast: boolean;
  detail: string;
  levels: LevelRange | null;
  energy: string | null;
  cost: string | null;
};

export type ChargeList = {
  summary: string[];
  sections: DaySection<ChargeRow>[];
};

export type ChargeDetail = {
  title: string;
  kind: string;
  fast: boolean;
  subtitle: string;
  fullAt: string | null;
  notice: string | null;
  hero: AppStat[];
  levels: LevelRange | null;
  stats: AppStat[];
  cost: { source: string; stats: AppStat[]; note: string | null } | null;
  charts: AppChart[];
  location: { latitude: number; longitude: number } | null;
  previousId: number | null;
  nextId: number | null;
};

export type PeriodId = "7d" | "30d" | "90d" | "1y" | "all";

export type ShareColor = "primary" | "charge";

export type AppRecord = {
  key: string;
  rank: number | null;
  title: string;
  badge: "AC" | "DC" | null;
  value: string | null;
  detail: string | null;
  note: string | null;
  bar: { share: number; color: ShareColor } | null;
  target: AppTarget | null;
  links: { label: string; target: AppTarget }[];
};

export type AppBlock =
  | { kind: "stats"; stats: AppStat[] }
  | { kind: "chart"; chart: AppChart }
  | {
      kind: "shares";
      rows: {
        label: string;
        share: number;
        text: string;
        color: ShareColor;
      }[];
    }
  | { kind: "records"; rows: AppRecord[] }
  | {
      kind: "heatmap";
      rows: { label: string; values: number[] }[];
      hours: string[];
      max: number;
      unit: string;
    }
  | { kind: "notice"; text: string }
  | {
      kind: "table";
      columns: string[];
      rows: { key: string; cells: AppValue[] }[];
    }
  | { kind: "progress"; share: number; start: string; end: string }
  | { kind: "map"; places: MapPlace[] }
  | { kind: "routes"; routes: LngLat[][] }
  | { kind: "note"; text: string };

export type AppPanel = {
  title: string;
  note: string | null;
  blocks: AppBlock[];
};

export type AppSection = {
  title: string | null;
  subtitle: string | null;
  period: boolean;
  panels: AppPanel[];
};

export type InsightPage = {
  title: string;
  subtitle: string | null;
  period: PeriodId;
  periods: { id: PeriodId; label: string }[];
  hero: AppStat[];
  heroBlocks: AppBlock[];
  sections: AppSection[];
};

export type TimelinePage = {
  day: string;
  title: string;
  previous: string;
  next: string | null;
  stats: AppStat[];
  strip: {
    segments: { kind: DayKind; start: number; end: number }[];
    now: number;
    hours: string[];
  };
  rows: {
    key: string;
    kind: "drive" | "charge" | "parked";
    time: string;
    title: string;
    detail: string;
    target: AppTarget | null;
  }[];
};

export type AppExport = { label: string; path: string; file: string };

export type ReportPage = {
  subtitle: string | null;
  from: string | null;
  to: string | null;
  presets: { label: string; from: string; to: string }[];
  stats: AppStat[];
  routes: LngLat[][] | null;
  markers: MapMarker[];
  sections: DaySection<DriveRow>[];
  notice: string | null;
  exports: AppExport[];
};

export type YearPage = {
  title: string;
  subtitle: string | null;
  year: number | null;
  years: number[];
  hero: AppStat[];
  heroBlocks: AppBlock[];
  sections: AppSection[];
};

export type LiveIcon =
  | "lock"
  | "lock-open"
  | "door-closed"
  | "door-open"
  | "plug"
  | "plug-zap"
  | "unplug"
  | "fan"
  | "badge-check"
  | "download"
  | "gauge"
  | "navigation"
  | "shield"
  | "shield-off";

export type LiveTone = "normal" | "active" | "charge" | "warning";

export type ActivityTone = "active" | "charge" | "quiet";

export type DayKind = "drive" | "charge" | "online" | "asleep" | "offline";

export type RecentRecord = {
  title: string;
  detail: string;
  target: AppTarget;
};

export type OverviewMenuKey =
  | "drives"
  | "charging"
  | "battery"
  | "stats"
  | "places"
  | "location"
  | "status"
  | "settings";

export type OverviewMenuRow = {
  key: OverviewMenuKey;
  title: string;
  subtitle: string | null;
};

export type OverviewCallout = {
  key: string;
  side: "left" | "top" | "right";
  label: string;
  value: string;
  tone: LiveTone;
};

export type OverviewPage = {
  car: { id: number; name: string; variant: string; image: string | null };
  activity: { label: string; tone: ActivityTone; updated: string };
  callouts: OverviewCallout[];
  menu: OverviewMenuRow[];
  empty: string | null;
  battery: {
    level: number | null;
    usable: number | null;
    value: AppValue;
    range: string;
    caption: string;
    tone: "charge" | "low" | "normal";
    fullAt: string | null;
  } | null;
  stats: AppStat[];
  live: {
    connected: boolean;
    tiles: {
      key: string;
      icon: LiveIcon;
      title: string;
      detail: string | null;
      tone: LiveTone;
      fullAt: string | null;
    }[];
    notices: string[];
    empty: string | null;
  } | null;
  today: {
    segments: { kind: DayKind; start: number; end: number }[];
    now: number;
    hours: string[];
  } | null;
  tires: {
    frontLeft: AppValue;
    frontRight: AppValue;
    rearLeft: AppValue;
    rearRight: AppValue;
    warnings: string[];
  } | null;
  location: { latitude: number; longitude: number; lastSeen: string } | null;
  history:
    | {
        key: string;
        icon: LiveIcon;
        title: string;
        when: string;
        tone: LiveTone;
      }[]
    | null;
  lastDrive: RecentRecord | null;
  lastCharge: RecentRecord | null;
};

export type SettingOption = { id: string; label: string };

export type SettingItem = {
  key: string;
  label: string;
  hint: string | null;
} & (
  | { kind: "choice"; value: string; options: SettingOption[] }
  | { kind: "switch"; value: boolean }
  | { kind: "price"; value: number | null }
);

export type SettingsPage = {
  preview: AppStat[];
  groups: { title: string; note: string | null; items: SettingItem[] }[];
  basemapKey?: string | null;
};

export type AppUser = { name: string; email: string; role: "admin" | "member" };

export type PairClaim = {
  token: string;
  check: string;
  status: "pending";
  user: { name: string };
};

export type PairStatus =
  { status: "pending" } | { status: "active"; user: AppUser };

export type AppMe = { user: AppUser; device: { name: string | null } };
