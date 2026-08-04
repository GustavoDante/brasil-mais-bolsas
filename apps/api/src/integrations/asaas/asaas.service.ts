import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AsaasCustomerRequest,
  AsaasCustomerResponse,
  AsaasErrorResponse,
  AsaasPaymentLinkRequest,
  AsaasPaymentLinkResponse,
  AsaasPaymentRequest,
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
} from './types/asaas.types';

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

  private async request<TResponse>(
    path: string,
    options: { method: 'GET' | 'POST'; body?: unknown },
  ): Promise<TResponse> {
    const apiKey = this.configService.get<string>('ASAAS_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException('asaas-api-key-not-configured');
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
    const message = this.extractAsaasErrorMessage(responseBody);

    if (status === 401 || status === 403) {
      throw new UnauthorizedException(message);
    }

    if (status >= 400 && status < 500) {
      throw new BadRequestException(message);
    }

    throw new ServiceUnavailableException(message);
  }

  private extractAsaasErrorMessage(responseBody: unknown): string {
    if (!this.isAsaasErrorResponse(responseBody)) {
      return 'asaas-request-failed';
    }

    const descriptions = responseBody.errors
      ?.map((error) => error.description)
      .filter((description): description is string => Boolean(description));

    return descriptions && descriptions.length > 0
      ? descriptions.join('; ')
      : 'asaas-request-failed';
  }

  private isAsaasErrorResponse(value: unknown): value is AsaasErrorResponse {
    return typeof value === 'object' && value !== null && 'errors' in value;
  }
}
