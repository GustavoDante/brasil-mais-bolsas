/**
 * Verificação do tratamento de erro das actions.
 *
 * Alimenta `normalizeError` com os corpos que o `AllExceptionsFilter` da API realmente
 * produz — e também com os que ele NÃO produz (proxy, rede, exceção do próprio Next) —
 * e confere o `code`/`message` resultante. Não precisa da API no ar.
 *
 * Uso: npx tsx scripts/check-action-errors.ts
 */
import { ERROR_CATALOG } from "@repo/contracts";

import { normalizeError } from "../src/actions/_core/action-error";
import { ApiError } from "../src/lib/api/errors";

interface Scenario {
  label: string;
  error: unknown;
  expectCode: string;
  expectMessage: string;
  expectFields?: string[];
}

/** Monta o corpo exatamente como o filtro global da API o serializa. */
function apiError(status: number, body: unknown): ApiError {
  return new ApiError({ kind: "http", status, message: "erro", body });
}

function filterBody(code: keyof typeof ERROR_CATALOG, extra: object = {}) {
  const { status, message } = ERROR_CATALOG[code];
  return {
    ok: false,
    code,
    message,
    statusCode: status,
    timestamp: new Date().toISOString(),
    path: "/v1/teste",
    ...extra,
  };
}

const scenarios: Scenario[] = [
  {
    label: "404 AppException('user-not-found')",
    error: apiError(404, filterBody("user-not-found")),
    expectCode: "user-not-found",
    expectMessage: "Usuário não encontrado.",
  },
  {
    label: "403 AppException('forbidden')",
    error: apiError(403, filterBody("forbidden")),
    expectCode: "forbidden",
    expectMessage: "Você não tem permissão para esta ação.",
  },
  {
    label: "400 ZodValidationException com fieldErrors",
    error: apiError(
      400,
      filterBody("validation-error", {
        fieldErrors: {
          email: ["E-mail inválido"],
          password: ["A senha deve ter ao menos 6 caracteres"],
        },
      }),
    ),
    expectCode: "validation-error",
    expectMessage: "Confira os campos destacados.",
    expectFields: ["email", "password"],
  },
  {
    label: "400 asaas-rejected (mensagem do gateway sobrepõe a do catálogo)",
    error: apiError(400, filterBody("asaas-rejected", { message: "CPF inválido" })),
    expectCode: "asaas-rejected",
    expectMessage: "CPF inválido",
  },
  {
    label: "429 too-many-requests",
    error: apiError(429, filterBody("too-many-requests")),
    expectCode: "too-many-requests",
    expectMessage: "Muitas tentativas. Aguarde um minuto e tente novamente.",
  },
  {
    label: "500 internal-error (nada da exceção original vaza)",
    error: apiError(500, filterBody("internal-error")),
    expectCode: "internal-error",
    expectMessage: "Tivemos um problema no servidor. Tente novamente em instantes.",
  },
  {
    // O proxy/balanceador devolve HTML ou um JSON que não é nosso: sem `code`, só o
    // status é confiável. É o caminho que impede o usuário de ver uma tela em branco.
    label: "502 do proxy, sem o corpo da nossa API",
    error: apiError(502, "<html>502 Bad Gateway</html>"),
    expectCode: "internal-error",
    expectMessage: "Tivemos um problema no servidor. Tente novamente em instantes.",
  },
  {
    label: "código que o web ainda não conhece (API mais nova)",
    error: apiError(404, {
      ok: false,
      code: "algo-que-nao-existe-aqui",
      message: "Mensagem que a API mandou.",
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: "/v1/teste",
    }),
    // Cai no genérico do status, mas exibe o texto que veio da API — é isso que faz um
    // frontend defasado continuar mostrando a mensagem certa.
    expectCode: "not-found",
    expectMessage: "Mensagem que a API mandou.",
  },
  {
    label: "falha de rede",
    error: new ApiError({ kind: "network", status: 0, message: "falha" }),
    expectCode: "network-error",
    expectMessage: "Não foi possível conectar ao servidor.",
  },
  {
    label: "timeout",
    error: new ApiError({ kind: "timeout", status: 0, message: "timeout" }),
    expectCode: "timeout-error",
    expectMessage: "A operação demorou mais que o esperado. Tente novamente.",
  },
  {
    label: "exceção inesperada (não-API)",
    error: new TypeError("undefined is not a function"),
    expectCode: "unknown-error",
    expectMessage: "Não foi possível concluir a operação. Tente novamente em instantes.",
  },
];

let failures = 0;

for (const scenario of scenarios) {
  const result = normalizeError(scenario.error);
  const problems: string[] = [];

  if (result.code !== scenario.expectCode) {
    problems.push(`code: esperado "${scenario.expectCode}", obtido "${result.code}"`);
  }
  if (result.message !== scenario.expectMessage) {
    problems.push(`message: esperado "${scenario.expectMessage}", obtido "${result.message}"`);
  }
  if (scenario.expectFields) {
    const fields = Object.keys(result.fieldErrors ?? {});
    const missing = scenario.expectFields.filter((field) => !fields.includes(field));
    if (missing.length > 0) problems.push(`fieldErrors sem: ${missing.join(", ")}`);
  }

  if (problems.length === 0) {
    console.log(`✓ ${scenario.label}`);
    console.log(`   → ${result.code} | ${result.message}`);
  } else {
    failures += 1;
    console.log(`✗ ${scenario.label}`);
    for (const problem of problems) console.log(`   ${problem}`);
  }
}

console.log(
  failures === 0
    ? `\nTratamento de erro OK (${scenarios.length} cenários)`
    : `\n${failures} cenário(s) falharam`
);
process.exitCode = failures === 0 ? 0 : 1;
