import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "app/**/*.{ts,tsx}",
      "features/**/*.{ts,tsx}",
      "components/layout/**/*.tsx",
      "components/shared/**/*.tsx",
    ],
    rules: {
      "no-restricted-globals": ["error", "alert", "confirm", "prompt"],
      "no-restricted-properties": [
        "error",
        ...["window", "globalThis"].flatMap((object) =>
          ["alert", "confirm", "prompt"].map((property) => ({
            object,
            property,
            message: "Use the shared shadcn dialog components.",
          }))
        ),
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXOpeningElement[name.name=/^(select|option|input|textarea|button|dialog)$/]",
          message:
            "Compose the shadcn UI primitives instead of native interactive controls.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/vad/**",
    "playwright-report/**",
    "test-results/**",
  ]),
])

export default eslintConfig
