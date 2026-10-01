import "server-only";
import { database } from "./database";

export type RangeKind = "rated" | "ideal";

export function rangeColumn(
  kind: RangeKind,
  alias: string,
  position: "start" | "end" | "battery",
) {
  const column =
    position === "battery"
      ? `${kind}_battery_range_km`
      : `${position}_${kind}_range_km`;
  return database()(`${alias}.${column}`);
}
