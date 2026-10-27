import { useQueryClient } from "@tanstack/react-query";
import { forgetAlertChoices } from "@/alerts/use-alerts";
import { forgetStored } from "@/api/queries";
import { useConnectionState } from "./connection-provider";
import type { Connection } from "./server";

export function useForgetPhone(): (connection: Connection) => Promise<void> {
  const queryClient = useQueryClient();
  const { forget } = useConnectionState();
  return async (connection) => {
    forgetStored(connection);
    await forgetAlertChoices();
    await forget();
    queryClient.clear();
  };
}
