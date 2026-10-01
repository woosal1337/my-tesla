import type { NextConfig } from "next";

const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins,
  cacheComponents: true,
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: {
    "/maplibre/[version]/[file]": [
      "./node_modules/maplibre-gl/package.json",
      "./node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs",
      "./node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs",
    ],
    "/*": ["./node_modules/@electric-sql/pglite/dist/**/*"],
  },
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
