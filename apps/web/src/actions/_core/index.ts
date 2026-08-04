/**
 * Núcleo compartilhado das actions.
 *
 * Este arquivo NÃO tem `"use server"` de propósito: ele exporta tipos e helpers síncronos,
 * e um módulo `"use server"` só pode exportar funções assíncronas.
 */
export {
  ACTION_ERROR_CODES,
  DEFAULT_ERROR_MESSAGE,
  TRANSPORT_ERRORS,
  buildActionError,
  normalizeError,
  type ActionError,
  type TransportErrorCode,
} from "./action-error";

export {
  actionDataOr,
  actionFailure,
  actionIdle,
  actionSuccess,
  isActionFailure,
  isActionSuccess,
  notAuthenticated,
  unwrapAction,
  type ActionFailure,
  type ActionResult,
  type ActionSuccess,
} from "./action-result";

export {
  executeAction,
  type ActionAuth,
  type ActionContext,
} from "./execute-action";

export { formDataToObject } from "./form-data";

/**
 * Blocos de validação — vêm de `@repo/contracts`, o contrato compartilhado com a API.
 *
 * Antes eram declarados em `_core/schemas.ts` "espelhando os decorators do backend".
 * Não espelham mais nada: são a mesma definição que o NestJS usa para validar.
 */
export {
  DURATION_TYPES,
  SCHOLARSHIP_TYPES,
  zAmount,
  zBoolean,
  zCpf,
  zDateString,
  zDocument,
  zEmail,
  zEnumValue,
  zId,
  zInt,
  zNumericString,
  zOptionalAmount,
  zOptionalBoolean,
  zOptionalDateString,
  zOptionalEmail,
  zOptionalEnumValue,
  zOptionalInt,
  zOptionalText,
  zPassword,
  zState,
  zStringArray,
  zStrongPassword,
  zText,
} from "@repo/contracts";
