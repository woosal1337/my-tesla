import { describe, expect, test } from "bun:test";
import { MqttConfigError, readMqttConfig } from "./config";

describe("readMqttConfig", () => {
  test("is off without MQTT_URL", () => {
    expect(readMqttConfig({})).toBeNull();
    expect(readMqttConfig({ MQTT_URL: "  " })).toBeNull();
  });

  test("reads the broker, the user, and the namespace", () => {
    expect(
      readMqttConfig({
        MQTT_URL: "mqtt://mosquitto:1883",
        MQTT_USERNAME: "mytesla",
        MQTT_PASSWORD: "secret",
        MQTT_NAMESPACE: "account_0",
      }),
    ).toEqual({
      url: "mqtt://mosquitto:1883",
      username: "mytesla",
      password: "secret",
      namespace: "account_0",
    });
  });

  test.each([
    [{ MQTT_URL: "not a url" }, "valid URL"],
    [{ MQTT_URL: "http://broker:1883" }, "scheme"],
    [{ MQTT_URL: "mqtt://user:pw@broker:1883" }, "MQTT_USERNAME"],
    [{ MQTT_URL: "mqtt://broker", MQTT_PASSWORD: "pw" }, "MQTT_USERNAME"],
    [{ MQTT_URL: "mqtt://broker", MQTT_NAMESPACE: "a/b" }, "MQTT_NAMESPACE"],
  ])("refuses %p", (environment, message) => {
    expect(() => readMqttConfig(environment)).toThrow(MqttConfigError);
    expect(() => readMqttConfig(environment)).toThrow(message);
  });
});
