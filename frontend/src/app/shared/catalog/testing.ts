import { of } from 'rxjs';
import { PublicProduct } from '../../core/catalog/product.models';
import { ProductsService } from '../../core/catalog/products.service';

export const TEST_PRODUCTS: readonly PublicProduct[] = [
  {
    id: 'p-1',
    slug: 'kit-desarrollo-sensorial',
    name: 'Kit Desarrollo Sensorial',
    summary: 'Una invitación a descubrir texturas, formas y colores.',
    contents: ['18 actividades guiadas.'],
    activities: 18,
    priceCop: 120000,
    inStock: true,
    imageUrl: 'images/kit-sensory.webp',
    imageAlt: 'Kit sensorial.',
  },
  {
    id: 'p-2',
    slug: 'kit-motricidad-y-coordinacion',
    name: 'Kit Motricidad y Coordinación',
    summary: 'Actividades para explorar el movimiento y la coordinación.',
    contents: ['20 actividades guiadas.'],
    activities: 20,
    priceCop: null,
    inStock: true,
    imageUrl: 'images/kit-motor.webp',
    imageAlt: 'Kit de motricidad.',
  },
  {
    id: 'p-3',
    slug: 'kit-comunicacion-y-lenguaje',
    name: 'Kit Comunicación y Lenguaje',
    summary: 'Momentos de juego para compartir palabras.',
    contents: ['16 actividades guiadas.'],
    activities: 16,
    priceCop: 95000,
    inStock: false,
    imageUrl: 'images/kit-language.webp',
    imageAlt: 'Kit de lenguaje.',
  },
];

/** ProductsService que responde con TEST_PRODUCTS sin pasar por HTTP. */
export function provideTestProducts(
  products: readonly PublicProduct[] = TEST_PRODUCTS,
) {
  return {
    provide: ProductsService,
    useValue: {
      list: () => of([...products]),
      bySlug: (slug: string) => of(products.find((p) => p.slug === slug)),
    },
  };
}
