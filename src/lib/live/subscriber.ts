import "server-only";
import mqtt, { type MqttClient } from "mqtt";
import { readMqttConfig, type MqttConfig } from "./config";
import {
  parseTopic,
  topicFilter,
  withMessage,
  type LiveValues,
} from "./topics";
import type { LiveStamps } from "./view";

type Listener = () => void;

type Feed = {
  client: MqttClient;
  connected: boolean;
  values: Map<number, LiveValues>;
  stamps: Map<number, LiveStamps>;
  listeners: Map<number, Set<Listener>>;
  ready: Promise<void>;
};

const feedKey = Symbol.for("my-tesla.mqtt-feed");
const firstValuesTimeoutMs = 1_500;
const retainedSettleMs = 250;

type FeedStore = typeof globalThis & { [feedKey]?: Feed | null };

function startFeed(config: MqttConfig): Feed {
  const client = mqtt.connect(config.url, {
    username: config.username,
    password: config.password,
    clientId: `my-tesla-${crypto.randomUUID().slice(0, 8)}`,
    clean: true,
    reconnectPeriod: 5_000,
    connectTimeout: 10_000,
  });
  const feed: Feed = {
    client,
    connected: false,
    values: new Map(),
    stamps: new Map(),
    listeners: new Map(),
    ready: Promise.resolve(),
  };
  feed.ready = new Promise((resolve) => {
    setTimeout(resolve, firstValuesTimeoutMs);
    client.once("connect", () => {
      client.subscribe(topicFilter(config.namespace), { qos: 0 }, () => {
        setTimeout(resolve, retainedSettleMs);
      });
    });
  });
  client.on("connect", () => {
    feed.connected = true;
  });
  client.on("close", () => {
    feed.connected = false;
  });
  client.on("error", (error) => {
    console.error(`MQTT: ${error.message}`);
  });
  client.on("message", (topic, payload) => {
    const parsed = parseTopic(topic, config.namespace);
    if (!parsed) return;
    const current = feed.values.get(parsed.carId) ?? {};
    const next = withMessage(current, parsed.key, payload.toString("utf8"));
    if (next === current) return;
    feed.values.set(parsed.carId, next);
    feed.stamps.set(parsed.carId, {
      ...feed.stamps.get(parsed.carId),
      [parsed.key]: Date.now(),
    });
    feed.listeners.get(parsed.carId)?.forEach((listener) => listener());
  });
  return feed;
}

function currentFeed(): Feed | null {
  const store = globalThis as FeedStore;
  if (store[feedKey] === undefined) {
    const config = readMqttConfig(process.env);
    store[feedKey] = config ? startFeed(config) : null;
  }
  return store[feedKey];
}

export async function mqttValues(carId: number): Promise<{
  connected: boolean;
  values: LiveValues;
  stamps: LiveStamps;
} | null> {
  const feed = currentFeed();
  if (!feed) return null;
  await feed.ready;
  return {
    connected: feed.connected,
    values: feed.values.get(carId) ?? {},
    stamps: feed.stamps.get(carId) ?? {},
  };
}

export function watchMqtt(
  carId: number,
  listener: Listener,
): (() => void) | null {
  const feed = currentFeed();
  if (!feed) return null;
  const listeners = feed.listeners.get(carId) ?? new Set<Listener>();
  listeners.add(listener);
  feed.listeners.set(carId, listeners);
  return () => {
    listeners.delete(listener);
  };
}
