/**
 * Verificação do tratamento de erro das actions.
 *
 * Alimenta `normalizeError` com os formatos que o `AllExceptionsFilter` da API realmente
 * produz e confere o `code`/`message` resultante. Não precisa da API no ar.
 *
 * Uso: npx tsx scripts/check-action-errors.ts
 */
import { normalizeError } from "../src/actions/_core/action-error";
import { ApiError } from "../src/lib/api/errors";

interface Scenario {
  label: string;
  error: unknown;
  expectCode: string;
  expectMessage: string;
  expectFields?: string[];
}

/** Monta o corpo como o filtro global da API devolve. */
function apiError(status: number, message: unknown): ApiError {
  return new ApiError({
    kind: "http",
    status,
    message: "erro",
    body: {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: "/v1/teste",
      message,
    },
  });
}

const scenarios: Scenario[] = [
  {
    label: "403 ForbiddenException('unauthorized')",
    error: apiError(403, { message: "unauthorized", error: "Forbidden", statusCode: 403 }),
    expectCode: "unauthorized",
    expectMessage: "Você não tem permissão para esta ação.",
  },
  {
    label: "404 NotFoundException('user-not-found')",
    error: apiError(404, { message: "user-not-found", error: "Not Found", statusCode: 404 }),
    expectCode: "user-not-found",
    expectMessage: "Usuário não encontrado.",
  },
  {
    label: "400 BadRequestException com userMessage",
    error: apiError(400, {
      message: "invalid-institution",
      userMessage: "Instituição inválida",
    }),
    expectCode: "invalid-institution",
    expectMessage: "Instituição inválida",
  },
  {
    label: "400 ValidationPipe (class-validator)",
    error: apiError(400, {
      statusCode: 400,
      message: [
        "email must be an email",
        "password must be longer than or equal to 6 characters",
      ],
      error: "Bad Request",
    }),
    expectCode: "validation-error",
    expectMessage: "Confira os campos destacados.",
    expectFields: ["email", "password"],
  },
  {
    label: "401 sem corpo reconhecível",
    error: apiError(401, { message: "Unauthorized", statusCode: 401 }),
    expectCode: "unauthorized",
    expectMessage: "Você não tem permissão para esta ação.",
  },
  {
    label: "429 ThrottlerException (texto técnico)",
    error: apiError(429, { statusCode: 429, message: "ThrottlerException: Too Many Requests" }),
    expectCode: "too-many-requests",
    expectMessage: "Muitas tentativas. Aguarde um minuto e tente novamente.",
  },
  {
    label: "500 genérico",
    error: apiError(500, "Erro interno do servidor"),
    expectCode: "server-error",
    expectMessage: "Tivemos um problema no servidor. Tente novamente em instantes.",
  },
  {
    label: "código novo, ainda sem tradução",
    error: apiError(404, { message: "algo-que-nao-mapeamos", statusCode: 404 }),
    expectCode: "algo-que-nao-mapeamos",
    expectMessage: "Registro não encontrado.",
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
