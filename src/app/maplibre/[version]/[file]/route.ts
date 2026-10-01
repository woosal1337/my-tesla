import { readFile } from "node:fs/promises";
import path from "node:path";
import { maplibreAsset } from "@/lib/maplibre-asset";

const packageDirectory = path.join(
  process.cwd(),
  "node_modules",
  "maplibre-gl",
);

async function installedVersion(): Promise<string> {
  const manifest = await readFile(
    path.join(packageDirectory, "package.json"),
    "utf8",
  );
  return (JSON.parse(manifest) as { version: string }).version;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/maplibre/[version]/[file]">,
) {
  const { version, file } = await params;
  const asset = maplibreAsset(version, file, await installedVersion());
  if (!asset) return new Response("Not found", { status: 404 });
  const body = await readFile(path.join(packageDirectory, "dist", asset));
  return new Response(body, {
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
