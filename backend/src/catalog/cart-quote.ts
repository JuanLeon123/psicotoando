import { MAX_LINE_QUANTITY } from './dto/cart-quote.dto';
import { Product, PublicProduct, toPublicProduct } from './product.entity';

/**
 * Por qué una línea no se puede comprar tal cual:
 * - unavailable: el producto ya no existe o no está publicado.
 * - no_price: aún no tiene precio.
 * - out_of_stock: inventario en 0.
 * - limited_stock: hay menos unidades de las pedidas; la cantidad se ajusta.
 */
export type CartLineIssue =
  'unavailable' | 'no_price' | 'out_of_stock' | 'limited_stock';

export interface CartQuoteLine {
  readonly productId: string;
  readonly product: PublicProduct | null;
  readonly requestedQuantity: number;
  /** Cantidad que se cobraría (ajustada al inventario disponible). */
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
  /** True si hay líneas y ninguna impide comprar (stock limitado se ajusta). */
  readonly purchasable: boolean;
}

const BLOCKING: readonly CartLineIssue[] = [
  'unavailable',
  'no_price',
  'out_of_stock',
];

/** Calcula el carrito con los precios y el inventario de la base de datos. */
export function buildCartQuote(
  requested: readonly { productId: string; quantity: number }[],
  products: readonly Product[],
): CartQuote {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = mergeQuantities(requested).map(
    ({ productId, quantity: requestedQuantity }): CartQuoteLine => {
      const product = byId.get(productId);
      if (!product?.published) {
        return blocked(productId, null, requestedQuantity, 'unavailable');
      }
      const publicProduct = toPublicProduct(product);
      if (product.priceCop === null) {
        return blocked(productId, publicProduct, requestedQuantity, 'no_price');
      }
      if (product.stock === 0) {
        return blocked(
          productId,
          publicProduct,
          requestedQuantity,
          'out_of_stock',
        );
      }
      const maxQuantity = Math.min(
        MAX_LINE_QUANTITY,
        product.stock ?? MAX_LINE_QUANTITY,
      );
      const quantity = Math.min(requestedQuantity, maxQuantity);
      return {
        productId,
        product: publicProduct,
        requestedQuantity,
        quantity,
        maxQuantity,
        unitPriceCop: product.priceCop,
        lineTotalCop: product.priceCop * quantity,
        issue: quantity < requestedQuantity ? 'limited_stock' : null,
      };
    },
  );
  const billable = lines.filter((l) => !isBlocking(l.issue));
  return {
    lines,
    itemCount: billable.reduce((sum, l) => sum + l.quantity, 0),
    subtotalCop: billable.reduce((sum, l) => sum + l.lineTotalCop, 0),
    purchasable: lines.length > 0 && billable.length === lines.length,
  };
}

function isBlocking(issue: CartLineIssue | null): boolean {
  return issue !== null && BLOCKING.includes(issue);
}

function blocked(
  productId: string,
  product: PublicProduct | null,
  requestedQuantity: number,
  issue: CartLineIssue,
): CartQuoteLine {
  return {
    productId,
    product,
    requestedQuantity,
    quantity: 0,
    maxQuantity: 0,
    unitPriceCop: product?.priceCop ?? null,
    lineTotalCop: 0,
    issue,
  };
}

/** Une líneas repetidas del mismo producto, respetando el orden de llegada. */
function mergeQuantities(
  items: readonly { productId: string; quantity: number }[],
): { productId: string; quantity: number }[] {
  const merged = new Map<string, number>();
  for (const { productId, quantity } of items) {
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }
  return [...merged].map(([productId, quantity]) => ({
    productId,
    quantity: Math.min(quantity, MAX_LINE_QUANTITY),
  }));
}
