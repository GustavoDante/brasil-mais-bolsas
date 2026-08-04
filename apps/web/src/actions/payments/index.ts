/** Actions do módulo `payments` — uma rota por arquivo. */
export {
  createCreditCardPayment,
  type CreateCreditCardPaymentInput,
} from "./create-credit-card-payment.action";
export {
  createInterestPayment,
  type CreateInterestPaymentInput,
} from "./create-interest-payment.action";
export {
  createPixPayment,
  type CreatePixPaymentInput,
} from "./create-pix-payment.action";
