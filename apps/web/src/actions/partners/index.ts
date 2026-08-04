/** Actions do módulo `partners` — uma rota por arquivo. */
export {
  createPartner,
  type CreatePartnerInput,
} from "./create-partner.action";
export {
  deletePartner,
  type DeletePartnerInput,
} from "./delete-partner.action";
export { getPartner, type GetPartnerInput } from "./get-partner.action";
export { listPartners, type ListPartnersInput } from "./list-partners.action";
export { loginPartner, type LoginPartnerInput } from "./login-partner.action";
export {
  registerPartnerAccess,
  type RegisterPartnerAccessInput,
} from "./register-partner-access.action";
export {
  togglePartner,
  type TogglePartnerInput,
} from "./toggle-partner.action";
export {
  updatePartner,
  type UpdatePartnerInput,
} from "./update-partner.action";
