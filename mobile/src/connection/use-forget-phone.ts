import { useQueryClient } from "@tanstack/react-query";
import { forgetAlertChoices } from "@/alerts/use-alerts";
import { forgetExports } from "@/api/export-file";
import { forgetStored } from "@/api/queries";
import { useConnectionState } from "./connection-provider";
import type { Connection } from "./server";

export function useForgetPhone(): (connection: Connection) => Promise<void> {
  const queryClient = useQueryClient();
  const { forget } = useConnectionState();
  return async (connection) => {
    await forget();
    queryClient.clear();
    forgetStored(connection);
    forgetExports();
    await forgetAlertChoices();
  };
}
