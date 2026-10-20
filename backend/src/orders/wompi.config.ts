import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type WompiEnvironment = 'sandbox' | 'production';

export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

/** Lee las llaves de Wompi del entorno. Sin las cuatro, el pago en línea está apagado. */
@Injectable()
export class WompiConfig {
  constructor(private readonly config: ConfigService) {}

  get environment(): WompiEnvironment {
    return this.config.get<WompiEnvironment>('WOMPI_ENV') ?? 'sandbox';
  }

  get publicKey(): string {
    return this.config.get<string>('WOMPI_PUBLIC_KEY') ?? '';
  }

  get privateKey(): string {
    return this.config.get<string>('WOMPI_PRIVATE_KEY') ?? '';
  }

  get integritySecret(): string {
    return this.config.get<string>('WOMPI_INTEGRITY_SECRET') ?? '';
  }

  get eventsSecret(): string {
    return this.config.get<string>('WOMPI_EVENTS_SECRET') ?? '';
  }

  get enabled(): boolean {
    return Boolean(
      this.publicKey &&
      this.privateKey &&
      this.integritySecret &&
      this.eventsSecret,
    );
  }

  get apiBase(): string {
    return this.environment === 'production'
      ? 'https://production.wompi.co/v1'
      : 'https://sandbox.wompi.co/v1';
  }
}
