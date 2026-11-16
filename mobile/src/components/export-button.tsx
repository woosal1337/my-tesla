import type { AppExport } from "@contract";
import { useMutation } from "@tanstack/react-query";
import { shareExport } from "@/api/export-file";
import { useConnection } from "@/connection/connection-provider";
import { Button } from "./button";
import { Text } from "./text";

export function ExportButton({
  item,
  disabled = false,
}: {
  item: AppExport;
  disabled?: boolean;
}) {
  const connection = useConnection();
  const share = useMutation({
    mutationFn: () => shareExport(connection, item.path, item.file),
  });
  return (
    <>
      <Button
        label={`Share ${item.label}`}
        kind="secondary"
        busy={share.isPending}
        disabled={disabled}
        onPress={() => share.mutate()}
      />
      {share.error ? (
        <Text variant="label" tone="destructive">
          {share.error.message}
        </Text>
      ) : null}
    </>
  );
}
