import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { WompiConfig } from './wompi.config';

/** Campos de una transacción de Wompi que usa la tienda. */
export interface WompiTransaction {
  readonly id: string;
  readonly status: string;
  readonly reference: string;
  readonly amount_in_cents: number;
  readonly currency: string;
  readonly payment_method_type?: string | null;
}

const TIMEOUT_MS = 10_000;
const UNAVAILABLE =
  'No pudimos consultar el pago en Wompi. Inténtalo de nuevo en unos segundos.';

/** Cliente HTTP mínimo de la API de Wompi (se sustituye por un doble en las pruebas). */
@Injectable()
export class WompiService {
  private readonly logger = new Logger(WompiService.name);

  constructor(private readonly config: WompiConfig) {}

  async getTransaction(id: string): Promise<WompiTransaction> {
    let response: Response;
    try {
      response = await fetch(
        `${this.config.apiBase}/transactions/${encodeURIComponent(id)}`,
        {
          headers: { Authorization: `Bearer ${this.config.privateKey}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
    } catch (error) {
      this.logger.warn(`Wompi no respondió: ${String(error)}`);
      throw new BadGatewayException(UNAVAILABLE);
    }
    if (!response.ok) {
      this.logger.warn(`Wompi respondió ${response.status} para ${id}`);
      throw new BadGatewayException(UNAVAILABLE);
    }
    const body = (await response.json()) as { data?: WompiTransaction };
    if (!body.data?.reference) throw new BadGatewayException(UNAVAILABLE);
    return body.data;
  }
}
