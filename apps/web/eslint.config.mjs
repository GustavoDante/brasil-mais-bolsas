import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktrees do Claude Code carregam uma cópia inteira do projeto (com build).
    // Sem ignorá-las, o `pnpm lint` falha com milhares de erros em código que não é nosso.
    ".claude/**",
  ]),
  {
    rules: {
      // Convenção do projeto: parâmetro/variável prefixado com `_` é intencionalmente
      // não usado (ex.: `run: (_input, { token }) => …` nas actions sem entrada).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
