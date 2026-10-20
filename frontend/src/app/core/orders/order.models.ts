import { CartItem } from '../cart/cart.models';

export type PaymentStatus = 'pending' | 'approved' | 'declined' | 'voided' | 'error';
export type FulfillmentStatus =
  | 'unfulfilled'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pago pendiente',
  approved: 'Pagado',
  declined: 'Rechazado',
  voided: 'Anulado',
  error: 'Error en el pago',
};

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  unfulfilled: 'Sin preparar',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export interface PaymentsConfig {
  readonly enabled: boolean;
  readonly environment: 'sandbox' | 'production';
}

export interface CheckoutCustomer {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly document: string;
}

export interface CheckoutShipping {
  readonly department: string;
  readonly city: string;
  readonly address: string;
  readonly notes: string | null;
}

export interface CheckoutRequest {
  readonly items: readonly CartItem[];
  readonly customer: CheckoutCustomer;
  readonly shipping: CheckoutShipping;
}

/** Respuesta de POST /api/checkout: a dónde enviar al cliente y con qué campos. */
export interface CheckoutSession {
  readonly reference: string;
  readonly checkoutUrl: string;
  readonly fields: Readonly<Record<string, string>>;
}

export interface OrderLine {
  readonly productId: string | null;
  readonly name: string;
  readonly quantity: number;
  readonly unitPriceCop: number;
  readonly lineTotalCop: number;
}

export interface PublicOrder {
  readonly reference: string;
  readonly status: PaymentStatus;
  readonly fulfillment: FulfillmentStatus;
  readonly items: readonly OrderLine[];
  readonly subtotalCop: number;
  readonly shippingCop: number;
  readonly totalCop: number;
  readonly emailMasked: string;
  readonly paymentMethod: string | null;
  readonly createdAt: string;
  readonly paidAt: string | null;
}

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
  readonly items: readonly OrderLine[];
  readonly subtotalCop: number;
  readonly shippingCop: number;
  readonly currency: string;
  readonly paymentMethod: string | null;
  readonly wompiTransactionId: string | null;
  readonly userId: string | null;
  readonly updatedAt: string;
}

export interface AdminOrderPage {
  readonly items: readonly OrderSummary[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminOrderFilters {
  readonly status?: PaymentStatus | '';
  readonly fulfillment?: FulfillmentStatus | '';
  readonly q?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

const PAYMENT_METHODS: Record<string, string> = {
  CARD: 'Tarjeta',
  PSE: 'PSE',
  NEQUI: 'Nequi',
  BANCOLOMBIA_TRANSFER: 'Botón Bancolombia',
  BANCOLOMBIA_QR: 'QR Bancolombia',
  BANCOLOMBIA_COLLECT: 'Efectivo (corresponsal)',
  BANCOLOMBIA_BNPL: 'Compra y paga después',
  DAVIPLATA: 'Daviplata',
  SU_PLUS: 'SU+ Pay',
  PCOL: 'Puntos Colombia',
};

/** «BANCOLOMBIA_TRANSFER» → «Botón Bancolombia». */
export function paymentMethodLabel(method: string | null): string {
  if (!method) return '—';
  return PAYMENT_METHODS[method] ?? method;
}

/** Departamentos de Colombia más Bogotá D.C. (los mismos que valida el backend). */
export const COLOMBIAN_DEPARTMENTS = [
  'Amazonas',
  'Antioquia',
  'Arauca',
  'Atlántico',
  'Bogotá D.C.',
  'Bolívar',
  'Boyacá',
  'Caldas',
  'Caquetá',
  'Casanare',
  'Cauca',
  'Cesar',
  'Chocó',
  'Córdoba',
  'Cundinamarca',
  'Guainía',
  'Guaviare',
  'Huila',
  'La Guajira',
  'Magdalena',
  'Meta',
  'Nariño',
  'Norte de Santander',
  'Putumayo',
  'Quindío',
  'Risaralda',
  'San Andrés y Providencia',
  'Santander',
  'Sucre',
  'Tolima',
  'Valle del Cauca',
  'Vaupés',
  'Vichada',
] as const;
