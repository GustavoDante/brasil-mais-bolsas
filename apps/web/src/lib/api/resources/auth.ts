import type { ApiOkResponse, AuthProfileDto, AuthResponseDto } from "../dto";
import { apiRequest, type ApiRequestOptions } from "../http";

type RequestContext = Pick<ApiRequestOptions, "signal">;

export interface LoginPayload {
  email: string;
  /** A API aceita a senha ou o CPF (só dígitos) do aluno. */
  password: string;
}

export const authResource = {
  /** `POST /v1/auth/login` — limitado a 10 tentativas por minuto por IP. */
  login(payload: LoginPayload, ctx: RequestContext = {}) {
    return apiRequest<AuthResponseDto>("/auth/login", {
      method: "POST",
      body: payload,
      ...ctx,
    });
  },

  /** `GET /v1/auth/me` — valida o token e devolve o perfil mínimo. */
  me(token: string, ctx: RequestContext = {}) {
    return apiRequest<AuthProfileDto>("/auth/me", { token, ...ctx });
  },

  /** `GET /v1/users/me` — dados completos do usuário autenticado. */
  profile(token: string, ctx: RequestContext = {}) {
    return apiRequest<ApiOkResponse & { user?: unknown }>("/users/me", { token, ...ctx });
  },
};
