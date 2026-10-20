export interface SiteSettings {
  /** Solo dígitos con indicativo, p. ej. 573001234567. */
  readonly whatsappNumber: string | null;
  readonly contactEmail: string | null;
  readonly instagramUrl: string | null;
  readonly facebookUrl: string | null;
  /** Valor fijo del envío en pesos. 0 = envío gratis. */
  readonly shippingFlatCop: number;
  /** Subtotal desde el que el envío es gratis. Null = sin umbral. */
  readonly freeShippingFromCop: number | null;
}

export const EMPTY_SETTINGS: SiteSettings = {
  whatsappNumber: null,
  contactEmail: null,
  instagramUrl: null,
  facebookUrl: null,
  shippingFlatCop: 0,
  freeShippingFromCop: null,
};

/** Costo del envío para un subtotal. Mismo cálculo que el backend al crear el pedido. */
export function shippingFor(
  settings: Pick<SiteSettings, 'shippingFlatCop' | 'freeShippingFromCop'>,
  subtotalCop: number,
): number {
  if (
    settings.freeShippingFromCop !== null &&
    subtotalCop >= settings.freeShippingFromCop
  ) {
    return 0;
  }
  return settings.shippingFlatCop;
}

/** Enlace de WhatsApp con un mensaje inicial opcional. */
export function whatsappUrl(number: string, text?: string): string {
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${number}${query}`;
}
