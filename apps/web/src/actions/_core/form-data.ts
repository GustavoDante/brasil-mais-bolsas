/**
 * Converte o `FormData` de um `<form action={...}>` em objeto simples, para alimentar as
 * actions tipadas a partir de `useActionState`.
 *
 * - strings vazias viram `undefined` (campo opcional não preenchido não deve virar `""`);
 * - campos repetidos viram array;
 * - checkbox (`"on"`) vira boolean quando o campo é declarado em `booleans`.
 */
export function formDataToObject(
  formData: FormData,
  options: { booleans?: string[]; numbers?: string[] } = {},
): Record<string, unknown> {
  const booleans = new Set(options.booleans ?? []);
  const numbers = new Set(options.numbers ?? []);
  const result: Record<string, unknown> = {};

  for (const key of new Set(formData.keys())) {
    const values = formData
      .getAll(key)
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim());

    if (booleans.has(key)) {
      result[key] = values.some((value) => value === "on" || value === "true");
      continue;
    }

    const meaningful = values.filter((value) => value.length > 0);

    if (meaningful.length === 0) continue;

    if (numbers.has(key)) {
      const parsed = Number(meaningful[0]);
      result[key] = Number.isFinite(parsed) ? parsed : meaningful[0];
      continue;
    }

    result[key] = meaningful.length > 1 ? meaningful : meaningful[0];
  }

  for (const key of booleans) {
    if (!(key in result)) result[key] = false;
  }

  return result;
}
