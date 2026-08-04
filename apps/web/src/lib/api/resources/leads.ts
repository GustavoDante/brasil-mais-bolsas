import type {
  ApiOkResponse,
  ContactRequestDto,
  IndicationRequestDto,
  PossiblePartnerRequestDto,
} from "../dto";
import { apiRequest, type ApiRequestOptions } from "../http";

type RequestContext = Pick<ApiRequestOptions, "signal">;

/**
 * Formulários do site. São mutações: sempre `no-store` e sempre chamadas a partir de
 * Server Actions (`src/actions`), nunca direto de um componente do cliente — assim o
 * token e o IP de origem ficam sob controle do servidor.
 */
export const leadsResource = {
  /** `POST /v1/contact` — formulário de contato (rota pública). */
  contact(payload: ContactRequestDto, ctx: RequestContext = {}) {
    return apiRequest<ApiOkResponse>("/contact", { method: "POST", body: payload, ...ctx });
  },

  /** `POST /v1/possible-partners` — instituição interessada em ser parceira (rota pública). */
  possiblePartner(payload: PossiblePartnerRequestDto, ctx: RequestContext = {}) {
    return apiRequest<ApiOkResponse>("/possible-partners", {
      method: "POST",
      body: payload,
      ...ctx,
    });
  },

  /** `POST /v1/indications` — indicação feita por um aluno logado (exige token). */
  indication(payload: IndicationRequestDto, token: string, ctx: RequestContext = {}) {
    return apiRequest<ApiOkResponse>("/indications", {
      method: "POST",
      body: payload,
      token,
      ...ctx,
    });
  },
};
