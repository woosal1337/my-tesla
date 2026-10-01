import "server-only";
import { demoLiveValues } from "@/lib/demo/live";
import { isDemoMode } from "@/lib/demo/mode";
import { mqttValues, watchMqtt } from "./subscriber";
import { liveView, type LiveView } from "./view";

export type LiveFeed = {
  connected: boolean;
  hasValues: boolean;
  view: LiveView;
};

export async function getLive(carId: number): Promise<LiveFeed | null> {
  const feed = isDemoMode()
    ? { connected: true, values: demoLiveValues(carId) }
    : await mqttValues(carId);
  if (!feed) return null;
  return {
    connected: feed.connected,
    hasValues: Object.keys(feed.values).length > 0,
    view: liveView(feed.values),
  };
}

export function watchLive(
  carId: number,
  listener: () => void,
): (() => void) | null {
  return isDemoMode() ? null : watchMqtt(carId, listener);
}
