export const analyticsEvents = {
  demoOpen: "demo_open",
  installOpen: "install_open",
  githubOpen: "github_open",
  docsOpen: "docs_open",
  sectionJump: "section_jump",
  landingOpen: "landing_open",
  outboundClick: "outbound_click",
  settingsChange: "settings_change",
} as const;

type AnalyticsEvent = (typeof analyticsEvents)[keyof typeof analyticsEvents];

export type AnalyticsConfig = { collectorUrl: string; key: string };

export class AnalyticsConfigError extends Error {
  name = "AnalyticsConfigError";
}

type Environment = Record<string, string | undefined>;

export function readAnalyticsConfig(
  environment: Environment,
): AnalyticsConfig | null {
  const url = environment.OPEN_ANALYTICS_URL?.trim();
  const key = environment.OPEN_ANALYTICS_KEY?.trim();
  if (!url || !key) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AnalyticsConfigError(
      "Set OPEN_ANALYTICS_URL to the collector, for example https://oa-c.example.com.",
    );
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new AnalyticsConfigError(
      "Use the https or http scheme in OPEN_ANALYTICS_URL.",
    );
  }
  return { collectorUrl: parsed.origin, key };
}

export function eventProps(
  name: AnalyticsEvent,
  props?: Record<string, string | undefined>,
): Record<string, string> {
  const attributes: Record<string, string> = { "data-oa-event": name };
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value) attributes[`data-oa-prop-${key.toLowerCase()}`] = value;
  }
  return attributes;
}

export function outboundProps(href: string): Record<string, string> {
  let host: string | undefined;
  try {
    host = new URL(href).hostname.replace(/^www\./, "");
  } catch {
    host = undefined;
  }
  return eventProps(analyticsEvents.outboundClick, { host });
}

type Tracker = {
  track: (name: string, props?: Record<string, string>) => void;
};

export function trackEvent(
  name: AnalyticsEvent,
  props?: Record<string, string>,
): void {
  const tracker = (globalThis as { oa?: Tracker }).oa;
  tracker?.track(name, props);
}
