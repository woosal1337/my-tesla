export const keychainKeys = {
  connection: "connection",
  car: "car",
  alerts: "alert-events",
} as const;

export const installMark = "installed";

export function isNewInstall(storedKeys: readonly string[]): boolean {
  return storedKeys.length === 0;
}
