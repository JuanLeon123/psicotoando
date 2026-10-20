import { PublicProduct } from '../catalog/product.models';

/** Lo que se guarda en el navegador: solo qué producto y cuántas unidades. */
export interface CartItem {
  readonly productId: string;
  readonly quantity: number;
}

/** Límites que también aplica el backend. */
export const MAX_CART_LINES = 20;
export const MAX_LINE_QUANTITY = 20;

export type CartLineIssue =
  | 'unavailable'
  | 'no_price'
  | 'out_of_stock'
  | 'limited_stock';

/** Respuesta de POST /api/cart/quote: precios e inventario reales. */
export interface CartQuoteLine {
  readonly productId: string;
  readonly product: PublicProduct | null;
  readonly requestedQuantity: number;
  readonly quantity: number;
  readonly maxQuantity: number;
  readonly unitPriceCop: number | null;
  readonly lineTotalCop: number;
  readonly issue: CartLineIssue | null;
}

export interface CartQuote {
  readonly lines: readonly CartQuoteLine[];
  readonly itemCount: number;
  readonly subtotalCop: number;
  readonly purchasable: boolean;
}

/** Un producto se puede añadir si tiene precio y no está agotado. */
export function canAddToCart(product: PublicProduct): boolean {
  return product.priceCop !== null && product.inStock;
}
