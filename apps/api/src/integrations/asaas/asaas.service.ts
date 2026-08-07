import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AsaasBoletoIdentificationFieldResponse,
  AsaasCustomerRequest,
  AsaasCustomerResponse,
  AsaasErrorResponse,
  AsaasPaymentLinkRequest,
  AsaasPaymentLinkResponse,
  AsaasPaymentRequest,
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
} from './types/asaas.types';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class AsaasService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('ASAAS_BASE_URL') ?? 'https://api-sandbox.asaas.com/v3';
  }

  createCustomer(payload: AsaasCustomerRequest): Promise<AsaasCustomerResponse> {
    return this.request<AsaasCustomerResponse>('/customers', {
      method: 'POST',
      body: payload,
    });
  }

  createPayment(payload: AsaasPaymentRequest): Promise<AsaasPaymentResponse> {
    return this.request<AsaasPaymentResponse>('/payments', {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * Cria um link de pagamento (usado pela renovação automática de pedidos, que cobra um
   * percentual da bolsa parcelado, deixando o aluno escolher a forma de pagamento).
   */
  createPaymentLink(payload: AsaasPaymentLinkRequest): Promise<AsaasPaymentLinkResponse> {
    return this.request<AsaasPaymentLinkResponse>('/paymentLinks', {
      method: 'POST',
      body: payload,
    });
  }

  getPixQrCode(paymentId: string): Promise<AsaasPixQrCodeResponse> {
    return this.request<AsaasPixQrCodeResponse>(`/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
    });
  }

  /** Linha digitável do boleto — chamada separada da criação da cobrança. */
  getBoletoIdentificationField(paymentId: string): Promise<AsaasBoletoIdentificationFieldResponse> {
    return this.request<AsaasBoletoIdentificationFieldResponse>(
      `/payments/${paymentId}/identificationField`,
      { method: 'GET' },
    );
  }

  private async request<TResponse>(
    path: string,
    options: { method: 'GET' | 'POST'; body?: unknown },
  ): Promise<TResponse> {
    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    if (!apiKey) {
      throw new AppException('asaas-api-key-not-configured');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: apiKey,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const responseBody: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      this.throwAsaasError(response.status, responseBody);
    }

    return responseBody as TResponse;
  }

  private throwAsaasError(status: number, responseBody: unknown): never {
    // Único lugar que usa o override de mensagem do `AppException`: o Asaas devolve a
    // descrição do que recusou ("CPF inválido", "cartão expirado") e ela é mais útil ao
    // usuário que qualquer texto genérico nosso. Quando não vem descrição, cai na
    // mensagem do catálogo.
    const message = this.extractAsaasErrorMessage(responseBody);
    const options = message ? { message } : undefined;

    if (status === 401 || status === 403) {
      throw new AppException('asaas-unauthorized', options);
    }

    if (status >= 400 && status < 500) {
      throw new AppException('asaas-rejected', options);
    }

    throw new AppException('asaas-unavailable', options);
  }

  /** Descrição que o Asaas deu para a recusa, ou `undefined` quando ele não deu nenhuma. */
  private extractAsaasErrorMessage(responseBody: unknown): string | undefined {
    if (!this.isAsaasErrorResponse(responseBody)) {
      return undefined;
    }

    const descriptions = responseBody.errors
      ?.map((error) => error.description)
      .filter((description): description is string => Boolean(description));

    return descriptions && descriptions.length > 0 ? descriptions.join('; ') : undefined;
  }

  private isAsaasErrorResponse(value: unknown): value is AsaasErrorResponse {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }
}
