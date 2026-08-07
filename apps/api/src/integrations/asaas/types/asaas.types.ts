export type AsaasBillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO';

export type AsaasCustomerRequest = {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string | null;
  province?: string;
  postalCode?: string;
  externalReference: string;
  notificationDisabled?: boolean;
};

export type AsaasCustomerResponse = {
  id: string;
  name: string;
  cpfCnpj: string;
  externalReference?: string;
};

export type AsaasCreditCard = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type AsaasCreditCardHolderInfo = {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string | null;
  phone?: string;
  mobilePhone: string;
};

export type AsaasPaymentRequest = {
  customer: string;
  billingType: AsaasBillingType;
  value?: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  creditCard?: AsaasCreditCard;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
  remoteIp?: string;
};

export type AsaasPaymentResponse = {
  id: string;
  status: string;
  value: number;
  netValue?: number;
  billingType: AsaasBillingType;
  dueDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  transactionReceiptUrl?: string;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
};

/**
 * Linha digitável do boleto. Não vem na resposta da criação da cobrança — o Asaas a expõe
 * numa chamada à parte, porque o registro no banco emissor é assíncrono.
 */
export type AsaasBoletoIdentificationFieldResponse = {
  identificationField: string;
  nossoNumero?: string;
  barCode?: string;
};

/** Links de pagamento aceitam `UNDEFINED` (o cliente escolhe a forma de pagamento). */
export type AsaasPaymentLinkBillingType = AsaasBillingType | 'UNDEFINED';

export type AsaasPaymentLinkChargeType = 'DETACHED' | 'RECURRENT' | 'INSTALLMENT';

export type AsaasPaymentLinkRequest = {
  name: string;
  description?: string;
  value?: number;
  billingType: AsaasPaymentLinkBillingType;
  chargeType: AsaasPaymentLinkChargeType;
  /** Dias que o link fica disponível para pagamento. */
  dueDateLimitDays?: number;
  maxInstallmentCount?: number;
  externalReference?: string;
  notificationEnabled?: boolean;
};

export type AsaasPaymentLinkResponse = {
  id: string;
  name: string;
  url: string;
  active: boolean;
  value?: number;
  billingType: AsaasPaymentLinkBillingType;
  chargeType: AsaasPaymentLinkChargeType;
  externalReference?: string;
};

export type AsaasPixQrCodeResponse = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export type AsaasErrorResponse = {
  errors?: Array<{
    code?: string;
    description?: string;
  }>;
};
