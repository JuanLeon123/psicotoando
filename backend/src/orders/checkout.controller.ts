import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from '../auth/auth.service';
import { SessionsService } from '../auth/sessions.service';
import { CheckoutDto, VerifyPaymentDto } from './dto/checkout.dto';
import { PublicOrder, toPublicOrder } from './order.views';
import { CheckoutSession, OrdersService } from './orders.service';
import {
  checksumMatches,
  eventChecksum,
  WompiEventSignature,
} from './wompi-signature';
import { WompiConfig, WompiEnvironment } from './wompi.config';
import { WompiService, WompiTransaction } from './wompi.service';

const SENSITIVE = { default: { limit: 10, ttl: 60_000 } };
const REFERENCE_PATTERN = /^PT-\d{8}-[A-Z0-9]{10}$/;

interface WompiEvent {
  readonly event?: string;
  readonly data?: { readonly transaction?: WompiTransaction };
  readonly signature?: WompiEventSignature;
  readonly timestamp?: number;
}

@Controller()
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(
    private readonly orders: OrdersService,
    private readonly wompiConfig: WompiConfig,
    private readonly wompi: WompiService,
    private readonly auth: AuthService,
    private readonly sessions: SessionsService,
  ) {}

  /** Si la tienda puede cobrar en línea. Nunca expone llaves. */
  @Get('payments/config')
  paymentsConfig(): { enabled: boolean; environment: WompiEnvironment } {
    return {
      enabled: this.wompiConfig.enabled,
      environment: this.wompiConfig.environment,
    };
  }

  @Throttle(SENSITIVE)
  @Post('checkout')
  async checkout(
    @Body() dto: CheckoutDto,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<CheckoutSession> {
    return this.orders.createCheckout(
      dto,
      await this.optionalUserId(authorization),
    );
  }

  /** Consulta el pago en Wompi al volver del checkout (útil en local, sin webhook). */
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('checkout/verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() dto: VerifyPaymentDto): Promise<PublicOrder> {
    const transaction = await this.wompi.getTransaction(dto.transactionId);
    const order = await this.orders.applyTransaction(transaction);
    if (!order)
      return toPublicOrder(
        await this.orders.getByReference(transaction.reference),
      );
    return toPublicOrder(order);
  }

  @Get('orders/:reference')
  async publicOrder(
    @Param('reference') reference: string,
  ): Promise<PublicOrder> {
    if (!REFERENCE_PATTERN.test(reference)) {
      throw new NotFoundException('No encontramos ese pedido.');
    }
    return toPublicOrder(await this.orders.getByReference(reference));
  }

  /** Webhook de Wompi: solo se aceptan eventos con checksum válido. */
  @SkipThrottle()
  @Post('payments/wompi/events')
  @HttpCode(HttpStatus.OK)
  async wompiEvent(
    @Body() body: unknown,
    @Headers('x-event-checksum') headerChecksum: string | undefined,
  ): Promise<{ received: true }> {
    const event = (body ?? {}) as WompiEvent;
    const secret = this.wompiConfig.eventsSecret;
    const received = event.signature?.checksum ?? headerChecksum;
    if (
      !secret ||
      !received ||
      !Array.isArray(event.signature?.properties) ||
      event.timestamp === undefined ||
      !checksumMatches(
        eventChecksum(
          event.data,
          event.signature.properties,
          event.timestamp,
          secret,
        ),
        received,
      )
    ) {
      throw new UnauthorizedException('Firma del evento no válida.');
    }
    const transaction = event.data?.transaction;
    if (event.event === 'transaction.updated' && transaction?.reference) {
      await this.orders.applyTransaction(transaction);
    } else {
      this.logger.log(
        `Evento de Wompi ignorado: ${event.event ?? 'sin nombre'}`,
      );
    }
    return { received: true };
  }

  /** Enlaza el pedido a la cuenta si viene una sesión válida; si no, compra como invitado. */
  private async optionalUserId(
    authorization: string | undefined,
  ): Promise<string | null> {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) return null;
    try {
      const payload = await this.auth.verifyAccessToken(token);
      return (await this.sessions.isActive(payload.sid, payload.sub))
        ? payload.sub
        : null;
    } catch {
      return null;
    }
  }
}
