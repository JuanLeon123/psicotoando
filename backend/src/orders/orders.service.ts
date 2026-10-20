import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import { CartQuote } from '../catalog/cart-quote';
import { ProductsService } from '../catalog/products.service';
import { MailService } from '../mail/mail.service';
import { shippingFor } from '../settings/site-settings.entity';
import { SettingsService } from '../settings/settings.service';
import { AdminOrdersQueryDto } from './dto/admin-orders.dto';
import { CheckoutDto } from './dto/checkout.dto';
import {
  FulfillmentStatus,
  Order,
  OrderItem,
  PaymentStatus,
} from './order.entity';
import { integritySignature } from './wompi-signature';
import { WOMPI_CHECKOUT_URL, WompiConfig } from './wompi.config';
import { WompiTransaction } from './wompi.service';

export const PAYMENTS_DISABLED =
  'El pago en línea aún no está disponible. Escríbenos y te ayudamos con tu pedido.';
const NOT_FOUND = 'No encontramos ese pedido.';
const CART_CHANGED =
  'Tu carrito cambió: revisa los productos y las cantidades antes de pagar.';
const CURRENCY = 'COP';
const BASE32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export interface CheckoutSession {
  readonly reference: string;
  readonly checkoutUrl: string;
  /** Campos del formulario GET del Web Checkout de Wompi. */
  readonly fields: Readonly<Record<string, string>>;
}

const WOMPI_STATUS: Record<string, PaymentStatus> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DECLINED: 'declined',
  VOIDED: 'voided',
  ERROR: 'error',
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly products: ProductsService,
    private readonly settings: SettingsService,
    private readonly wompi: WompiConfig,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Crea el pedido pendiente con precios del servidor y prepara el Web Checkout. */
  async createCheckout(
    dto: CheckoutDto,
    userId: string | null,
  ): Promise<CheckoutSession> {
    if (!this.wompi.enabled) {
      throw new ServiceUnavailableException(PAYMENTS_DISABLED);
    }
    const quote = await this.products.quote(dto.items);
    if (!isExactlyPurchasable(quote, dto.items)) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: CART_CHANGED,
        quote,
      });
    }
    const shippingCop = shippingFor(
      await this.settings.get(),
      quote.subtotalCop,
    );
    const totalCop = quote.subtotalCop + shippingCop;

    const order = await this.dataSource.transaction(async (manager) => {
      const created = manager.create(Order, {
        reference: newReference(),
        status: 'pending',
        userId,
        customerName: dto.customer.fullName,
        customerEmail: dto.customer.email,
        customerPhone: dto.customer.phone,
        customerDocument: dto.customer.document,
        shippingDepartment: dto.shipping.department,
        shippingCity: dto.shipping.city,
        shippingAddress: dto.shipping.address,
        shippingNotes: dto.shipping.notes ?? null,
        subtotalCop: quote.subtotalCop,
        shippingCop,
        totalCop,
        currency: CURRENCY,
        items: quote.lines.map((line) =>
          manager.create(OrderItem, {
            productId: line.productId,
            productName: line.product!.name,
            unitPriceCop: line.unitPriceCop!,
            quantity: line.quantity,
            lineTotalCop: line.lineTotalCop,
          }),
        ),
      });
      return manager.save(created);
    });

    const amountInCents = totalCop * 100;
    return {
      reference: order.reference,
      checkoutUrl: WOMPI_CHECKOUT_URL,
      fields: {
        'public-key': this.wompi.publicKey,
        currency: CURRENCY,
        'amount-in-cents': String(amountInCents),
        reference: order.reference,
        'signature:integrity': integritySignature(
          order.reference,
          amountInCents,
          CURRENCY,
          this.wompi.integritySecret,
        ),
        'redirect-url': `${this.config.getOrThrow<string>('FRONTEND_URL')}/pago/resultado`,
        'customer-data:email': order.customerEmail,
        'customer-data:full-name': order.customerName,
        'customer-data:phone-number': order.customerPhone,
        'customer-data:legal-id': order.customerDocument,
        'customer-data:legal-id-type': 'CC',
        'shipping-address:address-line-1': order.shippingAddress,
        'shipping-address:city': order.shippingCity,
        'shipping-address:region': order.shippingDepartment,
        'shipping-address:country': 'CO',
        'shipping-address:phone-number': order.customerPhone,
      },
    };
  }

  /**
   * Aplica el estado de una transacción de Wompi (webhook o consulta).
   * Idempotente: un pedido aprobado no vuelve atrás por eventos tardíos, el
   * inventario se descuenta una sola vez (y se repone una sola vez si Wompi
   * anula el pago) y los correos salen solo al aprobarse.
   */
  async applyTransaction(transaction: WompiTransaction): Promise<Order | null> {
    const status = WOMPI_STATUS[transaction.status];
    if (!status) {
      this.logger.warn(`Estado de Wompi desconocido: ${transaction.status}`);
      return this.findByReference(transaction.reference);
    }
    let newlyApproved = false;
    const order = await this.dataSource.transaction(async (manager) => {
      const current = await manager.findOne(Order, {
        where: { reference: transaction.reference },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) {
        this.logger.warn(
          `Pago para una referencia desconocida: ${transaction.reference}`,
        );
        return null;
      }
      if (
        transaction.amount_in_cents !== current.totalCop * 100 ||
        transaction.currency !== current.currency
      ) {
        this.logger.error(
          `Monto o moneda no coinciden en ${current.reference}: ${transaction.amount_in_cents} ${transaction.currency}`,
        );
        return current;
      }
      if (!canTransition(current.status, status)) return current;

      current.status = status;
      current.wompiTransactionId = transaction.id;
      current.paymentMethod = transaction.payment_method_type ?? null;
      if (status === 'approved' && !current.paidAt) {
        current.paidAt = new Date();
        newlyApproved = true;
      }
      if (status === 'approved' && !current.stockApplied) {
        await this.decrementStock(manager, current.id);
        current.stockApplied = true;
      }
      if (status === 'voided' && current.stockApplied) {
        // Pago anulado después de aprobarse: lo vendido vuelve al inventario.
        await this.restoreStock(manager, current.id);
        current.stockApplied = false;
        if (
          current.fulfillment === 'unfulfilled' ||
          current.fulfillment === 'preparing'
        ) {
          current.fulfillment = 'cancelled';
        }
        this.logger.warn(
          `Pago anulado en ${current.reference}; inventario repuesto.`,
        );
      }
      return manager.save(current);
    });
    if (!order) return null;
    const full = await this.findByReference(order.reference);
    if (newlyApproved && full) await this.notifyApproved(full);
    return full;
  }

  findByReference(reference: string): Promise<Order | null> {
    return this.orders.findOne({
      where: { reference },
      relations: { items: true },
    });
  }

  async getByReference(reference: string): Promise<Order> {
    const order = await this.findByReference(reference);
    if (!order) throw new NotFoundException(NOT_FOUND);
    return order;
  }

  listForUser(userId: string): Promise<Order[]> {
    return this.orders.find({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async listForAdmin(query: AdminOrdersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const qb = this.orders
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'i')
      .orderBy('o.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (query.status)
      qb.andWhere('o.status = :status', { status: query.status });
    if (query.fulfillment) {
      qb.andWhere('o.fulfillment = :fulfillment', {
        fulfillment: query.fulfillment,
      });
    }
    if (query.q) {
      const term = `%${query.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('o.reference ILIKE :term', { term })
            .orWhere('o.customer_name ILIKE :term', { term })
            .orWhere('o.customer_email ILIKE :term', { term }),
        ),
      );
    }
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async getForAdmin(id: string): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException(NOT_FOUND);
    return order;
  }

  async updateFulfillment(
    id: string,
    fulfillment: FulfillmentStatus,
  ): Promise<Order> {
    const order = await this.getForAdmin(id);
    order.fulfillment = fulfillment;
    await this.orders.save(order);
    return this.getForAdmin(id);
  }

  /** Resta lo vendido del inventario controlado, sin bajar de 0. */
  private async decrementStock(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
    await manager.query(
      `UPDATE products p
          SET stock = GREATEST(p.stock - sold.units, 0), updated_at = now()
         FROM (SELECT product_id, SUM(quantity)::int AS units
                 FROM order_items
                WHERE order_id = $1 AND product_id IS NOT NULL
                GROUP BY product_id) sold
        WHERE p.id = sold.product_id AND p.stock IS NOT NULL`,
      [orderId],
    );
  }

  /** Devuelve al inventario controlado lo que se había descontado por el pedido. */
  private async restoreStock(
    manager: EntityManager,
    orderId: string,
  ): Promise<void> {
    await manager.query(
      `UPDATE products p
          SET stock = p.stock + sold.units, updated_at = now()
         FROM (SELECT product_id, SUM(quantity)::int AS units
                 FROM order_items
                WHERE order_id = $1 AND product_id IS NOT NULL
                GROUP BY product_id) sold
        WHERE p.id = sold.product_id AND p.stock IS NOT NULL`,
      [orderId],
    );
  }

  private async notifyApproved(order: Order): Promise<void> {
    try {
      await this.mail.sendOrderConfirmation(order);
      const admin = this.config.get<string>('ADMIN_EMAIL');
      if (admin) await this.mail.sendNewOrderNotification(admin, order);
    } catch (error) {
      // El pago ya está confirmado; un fallo de correo no debe deshacerlo.
      this.logger.error(
        `No se pudo enviar el correo de ${order.reference}: ${String(error)}`,
      );
    }
  }
}

/** Comprable y sin cantidades recortadas respecto de lo que pidió el cliente. */
function isExactlyPurchasable(
  quote: CartQuote,
  items: readonly { productId: string; quantity: number }[],
): boolean {
  if (!quote.purchasable || quote.lines.length === 0) return false;
  return quote.lines.every((line) => line.issue === null) && items.length > 0;
}

/**
 * Transiciones permitidas. Un pedido aprobado solo puede pasar a anulado
 * (reversión real); los eventos atrasados no lo devuelven a pendiente, y una
 * anulación es definitiva (un «aprobado» atrasado no la revierte).
 */
function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to || from === 'voided') return false;
  if (from === 'approved') return to === 'voided';
  if (to === 'pending') return from === 'pending';
  return true;
}

/** PT-20261019-7K2M9QX4AB: fecha legible + 10 caracteres aleatorios (50 bits). */
function newReference(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const bytes = randomBytes(10);
  const random = Array.from(bytes, (b) => BASE32[b % BASE32.length]).join('');
  return `PT-${date}-${random}`;
}
