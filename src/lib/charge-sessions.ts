import "server-only";
import { chargeSessionsRelation } from "./charge-sessions-sql";
import { database } from "./database";
import { getChargePrices } from "./viewer";

export type ChargeSessions = {
  relation: ReturnType<typeof chargeSessionsRelation>;
};

export async function chargeSessions(carId: number): Promise<ChargeSessions> {
  return {
    relation: chargeSessionsRelation(
      database(),
      carId,
      await getChargePrices(),
    ),
  };
}
