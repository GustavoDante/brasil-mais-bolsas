"use server";

import { submitContact, type SubmitContactInput } from "@/actions/contact";
import {
  createPossiblePartner,
  type CreatePossiblePartnerInput,
} from "@/actions/possible-partners";
import { formDataToObject, type ActionResult } from "@/actions/_core";
import type { PossiblePartnerDto } from "@/lib/api/dto";

/**
 * Adaptadores de formulário: convertem o `FormData` de `useActionState` na entrada
 * tipada das actions.
 *
 * ```tsx
 * const [state, formAction] = useActionState(submitContactForm, actionIdle);
 * <form action={formAction}>…</form>
 * ```
 *
 * As actions tipadas continuam disponíveis para chamadas programáticas — este arquivo
 * só existe para o contrato `(previousState, formData)` que o React exige em formulários.
 */
export async function submitContactForm(
  _previous: ActionResult<null>,
  formData: FormData,
): Promise<ActionResult<null>> {
  return submitContact(formDataToObject(formData) as SubmitContactInput);
}

export async function createPossiblePartnerForm(
  _previous: ActionResult<PossiblePartnerDto | null>,
  formData: FormData,
): Promise<ActionResult<PossiblePartnerDto>> {
  return createPossiblePartner(
    formDataToObject(formData) as CreatePossiblePartnerInput,
  );
}
