export type LiveValues = Readonly<Record<string, string>>;

export type LiveTopic = { carId: number; key: string };

function carsPrefix(namespace: string | null): string {
  return namespace ? `teslamate/${namespace}/cars/` : "teslamate/cars/";
}

export function topicFilter(namespace: string | null): string {
  return `${carsPrefix(namespace)}+/+`;
}

export function parseTopic(
  topic: string,
  namespace: string | null,
): LiveTopic | null {
  const prefix = carsPrefix(namespace);
  if (!topic.startsWith(prefix)) return null;
  const parts = topic.slice(prefix.length).split("/");
  if (parts.length !== 2 || !parts[1]) return null;
  const carId = Number(parts[0]);
  if (!Number.isInteger(carId) || carId <= 0) return null;
  return { carId, key: parts[1] };
}

export function withMessage(
  values: LiveValues,
  key: string,
  payload: string,
): LiveValues {
  if (payload === "") {
    if (!(key in values)) return values;
    const next = { ...values };
    delete next[key];
    return next;
  }
  if (values[key] === payload) return values;
  return { ...values, [key]: payload };
}
