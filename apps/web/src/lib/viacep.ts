/**
 * Consulta de CEP no ViaCEP (serviço público dos Correios, sem chave).
 *
 * Fica fora do componente porque `fetch` solto em tela é justamente o que a arquitetura do
 * app evita. Não passa por `@/lib/api` nem por `@/data`: aquilo é a nossa API, isto é um
 * terceiro consultado direto do browser enquanto a pessoa digita.
 *
 * O contrato do ViaCEP é frouxo: CEP inexistente responde **200** com `{ "erro": true }`,
 * e endereço de cidade sem logradouro por CEP (interior) vem com `logradouro`/`bairro`
 * vazios. Por isso o retorno aqui é sempre parcial — quem chama preenche só o que veio.
 */

export interface CepAddress {
  street?: string;
  district?: string;
  city?: string;
  state?: string;
}

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean | string;
}

/** Só os dígitos — o campo aceita "50000-000" e o ViaCEP exige "50000000". */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export const CEP_LENGTH = 8;

export function isCompleteCep(value: string): boolean {
  return onlyDigits(value).length === CEP_LENGTH;
}

/** Máscara de exibição `00000-000`, aplicada enquanto a pessoa digita. */
export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, CEP_LENGTH);

  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

/**
 * Devolve o endereço do CEP, ou `null` quando o CEP não existe ou o serviço falha.
 *
 * Nunca lança: o autopreenchimento é uma conveniência, e uma queda do ViaCEP não pode
 * impedir alguém de terminar o cadastro digitando o endereço à mão.
 */
export async function fetchAddressByCep(
  cep: string,
  signal?: AbortSignal,
): Promise<CepAddress | null> {
  const digits = onlyDigits(cep);

  if (digits.length !== CEP_LENGTH) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as ViaCepResponse;

    if (data.erro) return null;

    return {
      street: data.logradouro || undefined,
      district: data.bairro || undefined,
      city: data.localidade || undefined,
      state: data.uf || undefined,
    };
  } catch {
    // Inclui o AbortError de quando a pessoa continua digitando: sem endereço, sem erro.
    return null;
  }
}
