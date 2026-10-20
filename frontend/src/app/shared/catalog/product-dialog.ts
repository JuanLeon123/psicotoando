import { canAddToCart } from '../../core/cart/cart.models';
import { formatCop } from '../../core/catalog/format-price';
import { PublicProduct } from '../../core/catalog/product.models';
import {
  InfoDialogAction,
  InfoDialogContent,
} from '../../core/services/info-dialog.service';
import { whatsappUrl } from '../../core/settings/site-settings.models';

/** Mensaje inicial al preguntar por un producto por WhatsApp. */
export function productOrderMessage(product: PublicProduct): string {
  return `Hola, me interesa el ${product.name}. ¿Me cuentan cómo puedo comprarlo?`;
}

export interface ProductDialogOptions {
  readonly whatsappNumber: string | null;
  /** Si se indica y el producto se puede comprar, la acción es «Añadir al carrito». */
  readonly onAddToCart?: (product: PublicProduct) => void;
}

/** Ficha de producto para la ventana informativa (portada y tienda). */
export function productDialogContent(
  product: PublicProduct,
  options: ProductDialogOptions,
): InfoDialogContent {
  return {
    eyebrow:
      product.activities !== null
        ? `${product.activities} actividades para compartir`
        : 'Nuestros kits',
    title: product.name,
    highlight: product.inStock ? formatCop(product.priceCop) : 'Agotado',
    description: product.summary,
    items: product.contents,
    image: product.imageUrl ?? undefined,
    imageAlt: product.imageAlt,
    action: productAction(product, options),
  };
}

function productAction(
  product: PublicProduct,
  { whatsappNumber, onAddToCart }: ProductDialogOptions,
): InfoDialogAction | undefined {
  if (onAddToCart && canAddToCart(product)) {
    return {
      label: 'Añadir al carrito',
      icon: 'cart',
      run: () => onAddToCart(product),
    };
  }
  if (whatsappNumber && product.inStock) {
    return {
      label: 'Preguntar por WhatsApp',
      icon: 'whatsapp',
      href: whatsappUrl(whatsappNumber, productOrderMessage(product)),
    };
  }
  return undefined;
}
