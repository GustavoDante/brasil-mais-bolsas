/** Actions do módulo `institutions` — uma rota por arquivo. */
export {
  createInstitution,
  type CreateInstitutionInput,
} from "./create-institution.action";
export {
  deleteInstitution,
  type DeleteInstitutionInput,
} from "./delete-institution.action";
export {
  getInstitution,
  type GetInstitutionInput,
} from "./get-institution.action";
export {
  getInstitutionByOldId,
  type GetInstitutionByOldIdInput,
} from "./get-institution-by-old-id.action";
export {
  listInstitutions,
  type ListInstitutionsInput,
} from "./list-institutions.action";
export {
  searchInstitutions,
  type SearchInstitutionsInput,
} from "./search-institutions.action";
export {
  searchInstitutionsByCity,
  type SearchInstitutionsByCityInput,
} from "./search-institutions-by-city.action";
export {
  toggleInstitution,
  type ToggleInstitutionInput,
} from "./toggle-institution.action";
export {
  updateInstitution,
  type UpdateInstitutionInput,
} from "./update-institution.action";
