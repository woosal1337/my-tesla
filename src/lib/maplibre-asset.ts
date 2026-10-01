const maplibreWorkerFiles = [
  "maplibre-gl-worker.mjs",
  "maplibre-gl-shared.mjs",
] as const;

export function maplibreAsset(
  version: string,
  file: string,
  installedVersion: string,
): string | null {
  if (version !== installedVersion) return null;
  return maplibreWorkerFiles.find((allowed) => allowed === file) ?? null;
}

export function maplibreWorkerUrl(version: string): string {
  return `/maplibre/${version}/${maplibreWorkerFiles[0]}`;
}
