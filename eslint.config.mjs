import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client — machine output, not hand-written source.
    // It accounted for ~1,110 of the 1,163 reported problems and buried the
    // ~50 real ones in application code.
    "src/generated/**",
    // Throwaway deploy helpers, not part of the app.
    ".vercel-tmp/**",
  ]),
]);

export default eslintConfig;
