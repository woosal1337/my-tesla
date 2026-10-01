import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".next-demo/**",
    ".next-build/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/map.tsx",
  ]),
]);

export default eslintConfig;
