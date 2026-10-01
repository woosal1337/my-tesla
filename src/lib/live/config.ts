export type MqttConfig = {
  url: string;
  username: string | undefined;
  password: string | undefined;
  namespace: string | null;
};

export class MqttConfigError extends Error {
  name = "MqttConfigError";
}

type Environment = Record<string, string | undefined>;

const mqttProtocols = new Set(["mqtt:", "mqtts:", "ws:", "wss:"]);

export function readMqttConfig(environment: Environment): MqttConfig | null {
  const url = environment.MQTT_URL?.trim();
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new MqttConfigError(
      "Set MQTT_URL to a valid URL, for example mqtt://mosquitto:1883.",
    );
  }
  if (!mqttProtocols.has(parsed.protocol)) {
    throw new MqttConfigError(
      "Use the mqtt, mqtts, ws, or wss scheme in MQTT_URL.",
    );
  }
  if (parsed.username || parsed.password) {
    throw new MqttConfigError(
      "Put the MQTT user in MQTT_USERNAME and MQTT_PASSWORD, not in MQTT_URL.",
    );
  }
  const username = environment.MQTT_USERNAME?.trim() || undefined;
  const password = environment.MQTT_PASSWORD || undefined;
  if (password && !username) {
    throw new MqttConfigError("Set MQTT_USERNAME with MQTT_PASSWORD.");
  }
  const namespace = environment.MQTT_NAMESPACE?.trim() || null;
  if (namespace && /[/+#]/.test(namespace)) {
    throw new MqttConfigError("Do not use /, +, or # in MQTT_NAMESPACE.");
  }
  return { url, username, password, namespace };
}
