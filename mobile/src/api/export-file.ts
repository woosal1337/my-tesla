import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { authorization, type Connection } from "@/connection/server";
import { ApiError } from "./client";

const exportTypes: Record<string, string> = {
  csv: "text/csv",
  gpx: "application/gpx+xml",
};

function exportsFolder(): Directory {
  return new Directory(Paths.cache, "exports");
}

export function forgetExports(): void {
  const folder = exportsFolder();
  if (folder.exists) folder.delete();
}

export async function shareExport(
  connection: Connection,
  path: string,
  fileName: string,
): Promise<void> {
  if (!path.startsWith("/api/cars/") || !/^[\w.-]+$/.test(fileName)) {
    throw new ApiError("The server sent an export that the app cannot open.");
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new ApiError("This phone cannot share files.");
  }
  forgetExports();
  const folder = exportsFolder();
  folder.create({ idempotent: true });
  const file = await File.downloadFileAsync(
    `${connection.url}${path}`,
    new File(folder, fileName),
    { headers: authorization(connection), idempotent: true },
  ).catch(() => {
    throw new ApiError("The export did not download. Try again.");
  });
  await Sharing.shareAsync(file.uri, {
    mimeType: exportTypes[fileName.split(".").pop() ?? ""],
    dialogTitle: fileName,
  });
}
