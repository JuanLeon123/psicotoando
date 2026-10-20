import { FulfillmentStatus, Order, PaymentStatus } from './order.entity';

export interface OrderLineView {
  readonly productId: string | null;
  readonly name: string;
  readonly quantity: number;
  readonly unitPriceCop: number;
  readonly lineTotalCop: number;
}

/** Lo que ve el cliente en la página de resultado (por referencia). */
export interface PublicOrder {
  readonly reference: string;
  readonly status: PaymentStatus;
  readonly fulfillment: FulfillmentStatus;
  readonly items: readonly OrderLineView[];
  readonly subtotalCop: number;
  readonly shippingCop: number;
  readonly totalCop: number;
  readonly emailMasked: string;
  readonly paymentMethod: string | null;
  readonly createdAt: string;
  readonly paidAt: string | null;
}

/** Fila de la lista de pedidos del panel y de «Mis pedidos». */
export interface OrderSummary {
  readonly id: string;
  readonly reference: string;
  readonly status: PaymentStatus;
  readonly fulfillment: FulfillmentStatus;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly itemCount: number;
  readonly totalCop: number;
  readonly createdAt: string;
  readonly paidAt: string | null;
}

export interface AdminOrderDetail extends OrderSummary {
  readonly customerPhone: string;
  readonly customerDocument: string;
  readonly shipping: {
    readonly department: string;
    readonly city: string;
    readonly address: string;
    readonly notes: string | null;
  };
  readonly items: readonly OrderLineView[];
  readonly subtotalCop: number;
  readonly shippingCop: number;
  readonly currency: string;
  readonly paymentMethod: string | null;
  readonly wompiTransactionId: string | null;
  readonly userId: string | null;
  readonly updatedAt: string;
}

function lines(order: Order): OrderLineView[] {
  return (order.items ?? []).map((item) => ({
    productId: item.productId,
    name: item.productName,
    quantity: item.quantity,
    unitPriceCop: item.unitPriceCop,
    lineTotalCop: item.lineTotalCop,
  }));
}

/** «ana.perez@correo.com» → «an•••@correo.com». */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}•••@${domain ?? ''}`;
}

export function toPublicOrder(order: Order): PublicOrder {
  return {
    reference: order.reference,
    status: order.status,
    fulfillment: order.fulfillment,
    items: lines(order),
    subtotalCop: order.subtotalCop,
    shippingCop: order.shippingCop,
    totalCop: order.totalCop,
    emailMasked: maskEmail(order.customerEmail),
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

export function toOrderSummary(order: Order): OrderSummary {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    fulfillment: order.fulfillment,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    itemCount: (order.items ?? []).reduce((sum, i) => sum + i.quantity, 0),
    totalCop: order.totalCop,
    createdAt: order.createdAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
  };
}

export function toAdminOrderDetail(order: Order): AdminOrderDetail {
  return {
    ...toOrderSummary(order),
    customerPhone: order.customerPhone,
    customerDocument: order.customerDocument,
    shipping: {
      department: order.shippingDepartment,
      city: order.shippingCity,
      address: order.shippingAddress,
      notes: order.shippingNotes,
    },
    items: lines(order),
    subtotalCop: order.subtotalCop,
    shippingCop: order.shippingCop,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    wompiTransactionId: order.wompiTransactionId,
    userId: order.userId,
    updatedAt: order.updatedAt.toISOString(),
  };
}
