import type { MigrationStep } from '../lib/context';
import {
  accessesStep,
  courseCategoriesStep,
  coursesStep,
  institutionsStep,
  partnersStep,
  scholarshipsStep,
  sellersStep,
} from './catalog.step';
import { ordersStep, paymentsStep, signedContractsStep } from './commerce.step';
import {
  callsStep,
  faqsStep,
  indicationCallsStep,
  indicationsStep,
  notificationsStep,
  possiblePartnerCallsStep,
  possiblePartnersStep,
} from './crm.step';
import { addressesStep, externalClientsStep, minorsStep, usersStep } from './people.step';

/**
 * Execution order matters: every step only runs after the tables it points to.
 * The new schema uses real foreign keys (onDelete: Restrict), the legacy one did not.
 */
export const steps: MigrationStep[] = [
  sellersStep,
  partnersStep,
  accessesStep,
  institutionsStep,
  courseCategoriesStep,
  coursesStep,
  scholarshipsStep,
  usersStep,
  addressesStep,
  minorsStep,
  externalClientsStep,
  ordersStep,
  paymentsStep,
  signedContractsStep,
  indicationsStep,
  indicationCallsStep,
  callsStep,
  notificationsStep,
  possiblePartnersStep,
  possiblePartnerCallsStep,
  faqsStep,
];
